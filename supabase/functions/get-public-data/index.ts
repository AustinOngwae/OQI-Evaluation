import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all necessary data in parallel
    const [questionsResponse, itemsResponse, mappingsResponse] = await Promise.all([
      supabaseAdmin.from('questions').select('*'),
      supabaseAdmin.from('evaluation_items').select('*'),
      supabaseAdmin.from('question_evaluation_mappings').select('*')
    ]);

    // Check for errors in each response
    if (questionsResponse.error) throw questionsResponse.error;
    if (itemsResponse.error) throw itemsResponse.error;
    if (mappingsResponse.error) throw mappingsResponse.error;

    const data = {
      questions: questionsResponse.data,
      evaluationItems: itemsResponse.data,
      questionEvaluationMappings: mappingsResponse.data,
    };

    return new Response(JSON.stringify(data), {
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