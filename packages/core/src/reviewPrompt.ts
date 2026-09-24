/**
 * When to ask a User to rate the app. Pure, no I/O.
 *
 * Apple forbids a rating screen of our own (Guideline 1.1.7): the only way is the system prompt,
 * which shows the stars and an optional review and sends them to the store without leaving the
 * app. It is shown at most three times a year per User, and whether it appears at all is the
 * system's decision, never ours — so this module decides only when it is worth asking.
 */

/** What the app remembers about asking. */
export interface ReviewPromptHistory {
  /** Every time the User was asked. */
  askedOn: readonly Date[];
}

const DAY_MS = 86_400_000;

/** A quarter between prompts: often enough to catch a good moment, rare enough not to nag. */
const QUARTER_DAYS = 90;

/** What iOS will actually show in a year; a fourth call is silently swallowed. */
const PROMPTS_PER_YEAR = 3;

/**
 * Whether to ask now. The caller decides *where* — after something has just gone right, never
 * on launch and never while the User is in the middle of something.
 */
export function shouldAskForReview(history: ReviewPromptHistory, today: Date): boolean {
  const asked = [...history.askedOn].sort((a, b) => a.getTime() - b.getTime());
  const last = asked[asked.length - 1];
  if (last && today.getTime() - last.getTime() < QUARTER_DAYS * DAY_MS) return false;

  const withinTheYear = asked.filter((date) => today.getTime() - date.getTime() < 365 * DAY_MS);
  return withinTheYear.length < PROMPTS_PER_YEAR;
}
