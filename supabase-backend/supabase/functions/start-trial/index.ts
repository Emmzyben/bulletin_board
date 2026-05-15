import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    // Check if user already has a subscription
    const { data: existingSubs, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_email', user.email)

    if (subError) {
      throw subError
    }

    if (existingSubs && existingSubs.length > 0 && existingSubs[0].plan === 'pro') {
      return new Response(
        JSON.stringify({ error: 'Already on Pro plan' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Create or update subscription with 14-day trial
    const trialStartDate = new Date()
    const trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000)

    if (existingSubs && existingSubs.length > 0) {
      // Update existing subscription
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          plan: 'free',
          trial_started_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
        })
        .eq('user_email', user.email)

      if (updateError) {
        throw updateError
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseClient
        .from('subscriptions')
        .insert({
          user_email: user.email,
          plan: 'free',
          trial_started_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
        })

      if (insertError) {
        throw insertError
      }
    }

    // Update workspace plan (simplified - in real implementation, you'd find user's workspace)
    // For now, we'll skip this step as it requires more complex logic

    return new Response(
      JSON.stringify({
        success: true,
        trial_ends: trialEndDate.toISOString(),
        message: `14-day free trial started! You'll be upgraded to Pro on ${trialEndDate.toLocaleDateString()}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})