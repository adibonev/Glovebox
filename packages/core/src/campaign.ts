/**
 * Campaign — which ad or post a new User came from, read off the tagged link they arrived by.
 * Pure, no I/O.
 *
 * Only the campaign's own labels are kept (the utm_* parameters the advertiser wrote), never a
 * click identifier (fbclid, gclid): those identify a person to the ad network, and the Meta Pixel
 * handles them itself, and only with consent.
 */

export interface Campaign {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  /** The page the visitor first landed on. */
  landing: string;
  /** "YYYY-MM-DD" of that first visit. */
  at: string;
}

const LABEL_LENGTH = 100;

/** The campaign a tagged link carries, or null for a visit that did not come from one. */
export function readCampaign(params: URLSearchParams, landing: string, today: Date): Campaign | null {
  const read = (name: string) => {
    const value = params.get(`utm_${name}`)?.trim();
    return value ? value.slice(0, LABEL_LENGTH) : null;
  };
  const labels = {
    source: read("source"),
    medium: read("medium"),
    campaign: read("campaign"),
    content: read("content"),
    term: read("term"),
  };
  if (Object.values(labels).every((value) => value === null)) return null;
  return { ...labels, landing: landing.slice(0, LABEL_LENGTH), at: today.toISOString().slice(0, 10) };
}
