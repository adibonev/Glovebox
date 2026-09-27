import { redirect } from "next/navigation";

/** The app's list of lapsed deadlines, opened on the website: the dashboard shows them. */
export default function RenewListRedirect() {
  redirect("/");
}
