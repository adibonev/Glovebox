import type { Metadata } from "next";

import { Landing } from "@/components/Landing";

// Built once at deploy and served as a file: a visitor with no account gets the page at once,
// instead of the loading screen while the server checks for a session they do not have.
export const dynamic = "force-static";

// Served at "/" (middleware rewrites anonymous visits here); "/start" is only the file's name.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function StartPage() {
  return <Landing />;
}
