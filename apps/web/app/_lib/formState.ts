/**
 * What a form-backed Server Action hands back to its `useActionState` form: a Bulgarian
 * message to show, or `null` when there is nothing to report. A successful action redirects,
 * so an error is the only thing that ever comes back.
 *
 * Lives outside `actions.ts` because a `"use server"` module may only export async functions.
 */
export type FormState = { error: string | null };

export const NO_FORM_ERROR: FormState = { error: null };
