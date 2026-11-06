export function formatPlanAmount(amountCents, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function getPlanPriceLabel(plan) {
  if (plan.billing_interval === 'forever') return formatPlanAmount(0, plan.currency);

  const monthlyCents = plan.billing_interval === 'year'
    ? plan.amount_cents / 12
    : plan.amount_cents;
  return `${formatPlanAmount(monthlyCents, plan.currency)} / seat / month`;
}

export function getPlanBillingDescription(plan) {
  if (plan.billing_interval === 'forever') return 'Forever · No credit card required';
  if (plan.billing_interval === 'year') {
    return `${formatPlanAmount(plan.amount_cents, plan.currency)} per seat, billed annually`;
  }
  return `Billed monthly${plan.trial_days ? ` · ${plan.trial_days}-day free trial` : ''}`;
}

export function getPlanSeatTotal(plan, seats) {
  const interval = plan.billing_interval === 'year' ? 'year' : 'month';
  return `${formatPlanAmount(plan.amount_cents * seats, plan.currency)} / ${interval}`;
}
