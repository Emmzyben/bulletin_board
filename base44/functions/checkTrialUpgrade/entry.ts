import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscription
    const subs = await base44.entities.Subscription.filter({ user_email: user.email });
    
    if (!subs.length) {
      return Response.json({ plan: 'free', trial_active: false });
    }

    const sub = subs[0];
    const now = new Date();
    const trialEndDate = sub.trial_end_date ? new Date(sub.trial_end_date) : null;

    // If trial has expired and plan is still "free", upgrade to pro
    if (trialEndDate && now >= trialEndDate && sub.plan === 'free') {
      await base44.entities.Subscription.update(sub.id, {
        plan: 'pro',
        pro_since_date: now.toISOString(),
      });

      // Also update workspace
      const workspaces = await base44.entities.Workspace.filter({ owner_email: user.email });
      if (workspaces.length > 0) {
        await base44.entities.Workspace.update(workspaces[0].id, { plan: 'pro' });
      }

      return Response.json({
        plan: 'pro',
        trial_active: false,
        upgraded: true,
        message: 'Trial ended - you\'ve been upgraded to Pro!',
      });
    }

    // Return current status
    const daysLeft = trialEndDate ? Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)) : 0;

    return Response.json({
      plan: sub.plan,
      trial_active: sub.plan === 'free' && daysLeft > 0,
      days_left: Math.max(0, daysLeft),
      trial_end_date: trialEndDate?.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});