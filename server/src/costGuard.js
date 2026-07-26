// Hard ceilings on paid-per-call usage (SerpApi, Qwen/HF), independent of
// any per-user quota. Per-user free/paid limits bound what one account can
// do; they say nothing about total spend once signups add up. This is what
// actually keeps the monthly bill bounded regardless of how many accounts
// exist or whether someone burns through their own quota fast.
//
// In-memory and per-process — resets on a Render redeploy/restart, which
// only ever makes the guard more conservative (a mid-month restart just
// starts the count over, it never lets more calls through than intended).

export class BudgetExceededError extends Error {}

const budgets = new Map();

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
}

function getState(name) {
  const month = currentMonthKey();
  let state = budgets.get(name);
  if (!state || state.month !== month) {
    state = { month, used: 0 };
    budgets.set(name, state);
  }
  return state;
}

export function remainingBudget(name, limit) {
  return limit - getState(name).used;
}

export function recordUsage(name, count = 1) {
  getState(name).used += count;
}
