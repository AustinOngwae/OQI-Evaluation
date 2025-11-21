import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAdminUser(supabaseClient) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) return { isAdmin: false, userId: null };
  
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profileError || !profile) return { isAdmin: false, userId: user.id };
  
  return { isAdmin: profile.role === 'admin', userId: user.id };
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

    const { isAdmin, userId } = await getAdminUser(supabaseClient);
    if (!isAdmin) {
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

    const { data, error } = await supabaseAdmin.rpc('apply_suggestion_tx', {
      p_suggestion_id: suggestion_id,
      p_suggestion_source: suggestion_source,
      p_admin_id: userId
    });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
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