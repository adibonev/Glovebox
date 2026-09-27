import { redirect } from "next/navigation";

/** The old editing address: everything about a Service Record now lives on its own page. */
export default async function EditServiceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/services/${id}`);
}
