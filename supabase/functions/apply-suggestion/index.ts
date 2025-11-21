import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to get user profile and check for admin role
async function isAdmin(supabaseClient) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return false;
  }

  return profile.role === 'admin';
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check if user is admin
    const isAdminUser = await isAdmin(supabaseClient);
    if (!isAdminUser) {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use service role for database modifications to bypass RLS
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { suggestion_id } = await req.json();
    if (!suggestion_id) {
      throw new Error("Suggestion ID is required.");
    }

    // Fetch the suggestion
    const { data: suggestion, error: suggestionError } = await supabaseAdmin
      .from('question_suggestions')
      .select('*')
      .eq('id', suggestion_id)
      .single();

    if (suggestionError) throw suggestionError;
    if (!suggestion) throw new Error("Suggestion not found.");
    if (suggestion.status !== 'pending') throw new Error("Suggestion has already been processed.");

    const { suggestion_type, payload, id: sugId, question_id } = suggestion;
    const userId = (await supabaseClient.auth.getUser()).data.user.id;

    // --- Main Logic ---
    if (suggestion_type === 'add') {
      const { options, linked_resources, new_resources, ...questionData } = payload;
      
      const newResourceIds = [];
      if (new_resources && new_resources.length > 0) {
        const { data: createdResources, error: resourceError } = await supabaseAdmin
          .from('resources')
          .insert(new_resources.map(r => ({ ...r, approved_by: userId, approved_at: new Date() })))
          .select('id');
        if (resourceError) throw resourceError;
        newResourceIds.push(...createdResources.map(r => r.id));
      }

      const { data: newQuestion, error: questionError } = await supabaseAdmin
        .from('questions')
        .insert(questionData)
        .select()
        .single();
      if (questionError) throw questionError;

      if (options && options.length > 0) {
        const mappings = options.flatMap(opt => 
          (opt.recommendations || []).map(recId => ({
            question_id: newQuestion.id,
            answer_value: opt.value,
            recommendation_item_id: recId,
          }))
        );
        if (mappings.length > 0) {
          const { error: mappingError } = await supabaseAdmin.from('question_evaluation_mappings').insert(mappings);
          if (mappingError) throw mappingError;
        }
      }

      const allResourceIds = [...(linked_resources || []), ...newResourceIds];
      if (allResourceIds.length > 0) {
        const resourceLinks = allResourceIds.map(resId => ({
          question_id: newQuestion.id,
          resource_id: resId,
        }));
        const { error: resourceLinkError } = await supabaseAdmin.from('question_resources').insert(resourceLinks);
        if (resourceLinkError) throw resourceLinkError;
      }

    } else if (suggestion_type === 'edit') {
      const { options, linked_resources, new_resources, id: qId, ...questionData } = payload;
      
      const newResourceIds = [];
      if (new_resources && new_resources.length > 0) {
        const { data: createdResources, error: resourceError } = await supabaseAdmin
          .from('resources')
          .insert(new_resources.map(r => ({ ...r, approved_by: userId, approved_at: new Date() })))
          .select('id');
        if (resourceError) throw resourceError;
        newResourceIds.push(...createdResources.map(r => r.id));
      }

      const { error: questionError } = await supabaseAdmin.from('questions').update(questionData).eq('id', qId);
      if (questionError) throw questionError;

      await supabaseAdmin.from('question_evaluation_mappings').delete().eq('question_id', qId);
      await supabaseAdmin.from('question_resources').delete().eq('question_id', qId);

      if (options && options.length > 0) {
        const mappings = options.flatMap(opt => 
          (opt.recommendations || []).map(recId => ({
            question_id: qId,
            answer_value: opt.value,
            recommendation_item_id: recId,
          }))
        );
        if (mappings.length > 0) {
          const { error: mappingError } = await supabaseAdmin.from('question_evaluation_mappings').insert(mappings);
          if (mappingError) throw mappingError;
        }
      }

      const allResourceIds = [...(linked_resources || []), ...newResourceIds];
      if (allResourceIds.length > 0) {
        const resourceLinks = allResourceIds.map(resId => ({
          question_id: qId,
          resource_id: resId,
        }));
        const { error: resourceLinkError } = await supabaseAdmin.from('question_resources').insert(resourceLinks);
        if (resourceLinkError) throw resourceLinkError;
      }

    } else if (suggestion_type === 'delete') {
      const { error: deleteError } = await supabaseAdmin.from('questions').delete().eq('id', question_id);
      if (deleteError) throw deleteError;
    }

    // Finally, update the suggestion status
    const { error: updateSuggestionError } = await supabaseAdmin
      .from('question_suggestions')
      .update({ status: 'approved', resolved_at: new Date(), resolved_by: userId })
      .eq('id', sugId);
    if (updateSuggestionError) throw updateSuggestionError;

    return new Response(JSON.stringify({ message: 'Suggestion applied successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})