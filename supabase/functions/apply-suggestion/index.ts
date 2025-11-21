import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function isAdmin(supabaseClient) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) return false;
  const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
  if (profileError || !profile) return false;
  return profile.role === 'admin';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    if (!await isAdmin(supabaseClient)) {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { suggestion_id, suggestion_source } = await req.json();
    if (!suggestion_id || !suggestion_source) {
      throw new Error("Suggestion ID and source are required.");
    }

    const userId = (await supabaseClient.auth.getUser()).data.user.id;

    if (suggestion_source === 'resource_suggestions') {
      const { data: suggestion, error: suggestionError } = await supabaseAdmin.from('resource_suggestions').select('*').eq('id', suggestion_id).single();
      if (suggestionError) throw suggestionError;
      if (!suggestion) throw new Error("Resource suggestion not found.");
      if (suggestion.status !== 'pending') throw new Error("Suggestion has already been processed.");

      const { error: resourceError } = await supabaseAdmin.from('resources').insert({
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        url: suggestion.url,
        approved_by: userId,
        approved_at: new Date(),
      });
      if (resourceError) throw resourceError;

      const { error: updateError } = await supabaseAdmin.from('resource_suggestions').update({ status: 'approved', resolved_at: new Date(), resolved_by: userId }).eq('id', suggestion.id);
      if (updateError) throw updateError;

    } else if (suggestion_source === 'question_suggestions') {
      const { data: suggestion, error: suggestionError } = await supabaseAdmin.from('question_suggestions').select('*').eq('id', suggestion_id).single();
      if (suggestionError) throw suggestionError;
      if (!suggestion) throw new Error("Question suggestion not found.");
      if (suggestion.status !== 'pending') throw new Error("Suggestion has already been processed.");

      const { suggestion_type, payload, id: sugId, question_id } = suggestion;

      if (suggestion_type === 'add') {
        const { options, linked_resources, new_resources, ...questionData } = payload;
        const newResourceIds = [];
        if (new_resources && new_resources.length > 0) {
          const { data: created, error } = await supabaseAdmin.from('resources').insert(new_resources.map(r => ({ ...r, approved_by: userId, approved_at: new Date() }))).select('id');
          if (error) throw error;
          newResourceIds.push(...created.map(r => r.id));
        }
        const { data: newQ, error: qError } = await supabaseAdmin.from('questions').insert(questionData).select().single();
        if (qError) throw qError;
        if (options && options.length > 0) {
          const mappings = options.flatMap(opt => (opt.recommendations || []).map(recId => ({ question_id: newQ.id, answer_value: opt.value, recommendation_item_id: recId })));
          if (mappings.length > 0) {
            const { error: mError } = await supabaseAdmin.from('question_evaluation_mappings').insert(mappings);
            if (mError) throw mError;
          }
        }
        const allResourceIds = [...(linked_resources || []), ...newResourceIds];
        if (allResourceIds.length > 0) {
          const links = allResourceIds.map(resId => ({ question_id: newQ.id, resource_id: resId }));
          const { error: rLError } = await supabaseAdmin.from('question_resources').insert(links);
          if (rLError) throw rLError;
        }
      } else if (suggestion_type === 'edit') {
        const { options, linked_resources, new_resources, id: qId, ...questionData } = payload;
        const newResourceIds = [];
        if (new_resources && new_resources.length > 0) {
          const { data: created, error } = await supabaseAdmin.from('resources').insert(new_resources.map(r => ({ ...r, approved_by: userId, approved_at: new Date() }))).select('id');
          if (error) throw error;
          newResourceIds.push(...created.map(r => r.id));
        }
        const { error: qError } = await supabaseAdmin.from('questions').update(questionData).eq('id', qId);
        if (qError) throw qError;
        await supabaseAdmin.from('question_evaluation_mappings').delete().eq('question_id', qId);
        await supabaseAdmin.from('question_resources').delete().eq('question_id', qId);
        if (options && options.length > 0) {
          const mappings = options.flatMap(opt => (opt.recommendations || []).map(recId => ({ question_id: qId, answer_value: opt.value, recommendation_item_id: recId })));
          if (mappings.length > 0) {
            const { error: mError } = await supabaseAdmin.from('question_evaluation_mappings').insert(mappings);
            if (mError) throw mError;
          }
        }
        const allResourceIds = [...(linked_resources || []), ...newResourceIds];
        if (allResourceIds.length > 0) {
          const links = allResourceIds.map(resId => ({ question_id: qId, resource_id: resId }));
          const { error: rLError } = await supabaseAdmin.from('question_resources').insert(links);
          if (rLError) throw rLError;
        }
      } else if (suggestion_type === 'delete') {
        const { error } = await supabaseAdmin.from('questions').delete().eq('id', question_id);
        if (error) throw error;
      } else if (suggestion_type === 'suggest_resource') {
        const { data: newResource, error: resourceError } = await supabaseAdmin.from('resources').insert({ ...payload, approved_by: userId, approved_at: new Date() }).select('id').single();
        if (resourceError) throw resourceError;
        const { error: linkError } = await supabaseAdmin.from('question_resources').insert({ question_id: question_id, resource_id: newResource.id });
        if (linkError) throw linkError;
      }

      const { error: updateError } = await supabaseAdmin.from('question_suggestions').update({ status: 'approved', resolved_at: new Date(), resolved_by: userId }).eq('id', sugId);
      if (updateError) throw updateError;

    } else {
      throw new Error(`Invalid suggestion source: ${suggestion_source}`);
    }

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