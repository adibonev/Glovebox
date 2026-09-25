/**
 * The date of first registration someone typed into the inspection calculator, kept in their
 * browser so the form for their first car can offer it back after they sign up. A convenience
 * only: missing, blocked or cleared storage just means the field starts empty.
 */
const KEY = "glovebox.firstRegistration";

export function rememberFirstRegistration(value: string) {
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) localStorage.setItem(KEY, value);
  } catch {
    // private mode: nothing to keep it in
  }
}

export function recalledFirstRegistration(): string | null {
  try {
    const value = localStorage.getItem(KEY);
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}
