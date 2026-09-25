import { Loader } from "@/components/Loader";

/**
 * The loader while the dashboard gathers its data. Kept to this group: at the app root it also
 * wrapped the prebuilt landing page, whose HTML then opened with an empty loading screen.
 */
export default function Loading() {
  return <Loader />;
}
