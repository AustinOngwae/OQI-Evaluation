import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// CORS headers to allow requests from your web app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get the OpenAI API key from Supabase secrets.
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  // This is needed for CORS to work
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Check if the API key is available
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key is not set in Supabase secrets.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    // Get the submission data from the request
    const { submission, questions } = await req.json()

    // --- Construct a detailed prompt for the AI ---
    let promptText = `Analyze the following submission for the GESDA Open Quantum Institute (OQI) pilot evaluation. The user has provided the following information about themselves:\n`;
    promptText += `Name: ${submission.user_context?.firstName} ${submission.user_context?.lastName}\n`;
    promptText += `Job Title: ${submission.user_context?.jobTitle}\n`;
    promptText += `Organization: ${submission.user_context?.organization}\n`;
    promptText += `Qualifications: ${submission.user_context?.qualifications}\n\n`;
    promptText += `Here are their answers to the questionnaire:\n\n`;

    questions.sort((a, b) => a.step_id - b.step_id).forEach(q => {
      const answerData = submission.answers[q.id];
      if (answerData && answerData.answer) {
        let answerDisplay = answerData.answer;
        if (Array.isArray(answerDisplay)) {
            const labels = answerDisplay.map(val => {
                const option = q.options?.find(opt => opt.value === val);
                return option ? option.label : val;
            });
            answerDisplay = labels.join(', ');
        } else if (q.type === 'radio' || q.type === 'select') {
            const option = q.options?.find(opt => opt.value === answerDisplay);
            answerDisplay = option ? option.label : answerDisplay;
        }
        promptText += `Q: ${q.title}\nA: ${String(answerDisplay)}\n`;
        if (answerData.comment) {
          promptText += `Comment: ${answerData.comment}\n`;
        }
        promptText += `\n`;
      }
    });

    promptText += `Based on this submission, please provide a concise, insightful, and well-structured executive summary. The summary should highlight the key strengths and potential weaknesses of the user's profile or project in the context of the OQI's goals. Structure the output in markdown format. Start with a main heading "# AI-Generated Executive Summary".`;
    // --- End of prompt construction ---

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`OpenAI API error: ${errorBody.error.message}`);
    }

    const result = await response.json();
    const summary = result.choices[0].message.content;

    // Send the generated summary back to the web app
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})