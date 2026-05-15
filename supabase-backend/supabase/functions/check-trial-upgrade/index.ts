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

    // Get user subscription
    const { data: subs, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_email', user.email)

    if (subError) {
      throw subError
    }

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ plan: 'free', trial_active: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const sub = subs[0]
    const now = new Date()
    const trialEndDate = sub.trial_end_date ? new Date(sub.trial_end_date) : null

    // If trial has expired and plan is still "free", upgrade to pro
    if (trialEndDate && now >= trialEndDate && sub.plan === 'free') {
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          plan: 'pro',
          pro_since_date: now.toISOString(),
        })
        .eq('user_email', user.email)

      if (updateError) {
        throw updateError
      }

      // Update workspace plan (simplified)
      // In a real implementation, you'd update the user's workspace

      return new Response(
        JSON.stringify({
          plan: 'pro',
          trial_active: false,
          upgraded: true,
          message: 'Trial ended - you\'ve been upgraded to Pro!',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Return current status
    const daysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

    return new Response(
      JSON.stringify({
        plan: sub.plan,
        trial_active: sub.plan === 'free' && daysLeft > 0,
        days_left: Math.max(0, daysLeft),
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