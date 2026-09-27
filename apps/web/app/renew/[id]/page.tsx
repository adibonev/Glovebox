import { redirect } from "next/navigation";

/**
 * The app's renewal address (a notification's link, `renewalLink` in core) opened on the website:
 * the same Service Record's page, where it is renewed.
 */
export default async function RenewRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(/^\d+$/.test(id) ? `/services/${id}` : "/");
}
