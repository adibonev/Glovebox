import { redirect } from "next/navigation";

/**
 * An invite link that lost its code on the way (pasted as "glovebox.bg/i/", or split across two
 * lines in a message) lands on the home page rather than on a 404.
 */
export default function InviteWithoutCode() {
  redirect("/");
}
