import { Loader } from "@/components/Loader";

/** Route-level Suspense fallback — the Glovebox loader during navigation / first load. */
export default function Loading() {
  return <Loader />;
}
