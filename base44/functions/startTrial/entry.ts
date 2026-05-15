import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a subscription
    const existing = await base44.entities.Subscription.filter({ user_email: user.email });

    if (existing.length > 0 && existing[0].plan === 'pro') {
      return Response.json({ error: 'Already on Pro plan' }, { status: 400 });
    }

    // Create or update subscription with 14-day trial
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (existing.length > 0) {
      // Update existing subscription
      await base44.entities.Subscription.update(existing[0].id, {
        plan: 'free',
        trial_started_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
      });
    } else {
      // Create new subscription
      await base44.entities.Subscription.create({
        user_email: user.email,
        plan: 'free',
        trial_started_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
      });
    }

    // Also update workspace plan to reflect trial
    const workspaces = await base44.entities.Workspace.filter({ owner_email: user.email });
    if (workspaces.length > 0) {
      await base44.entities.Workspace.update(workspaces[0].id, { plan: 'free' });
    }

    return Response.json({
      success: true,
      trial_ends: trialEndDate.toISOString(),
      message: `14-day free trial started! You\'ll be upgraded to Pro on ${trialEndDate.toLocaleDateString()}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});