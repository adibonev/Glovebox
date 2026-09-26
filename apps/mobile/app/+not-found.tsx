import { Redirect } from "expo-router";

/**
 * A link the app has no screen for opens the app's home instead of an error page: an invite link
 * that lost its code on the way ("glovebox.bg/i/"), or a path from an older version. Signed out,
 * home sends on to the login screen as usual.
 */
export default function NotFound() {
  return <Redirect href="/" />;
}
