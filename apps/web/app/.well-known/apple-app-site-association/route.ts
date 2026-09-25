/**
 * Apple's list of the links the iPhone app may open instead of the browser (universal links).
 * Fetched by Apple from this exact path, so it must answer 200 with JSON and no redirect.
 *
 * Invites and car invitations: someone who already has the app lands straight in it, with the
 * code or the car kept. A passport link stays in the browser: its readers are buyers without it.
 */
const APP_ID = "TUVMJC4VMX.bg.glovebox.app";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [APP_ID],
          components: [
            { "/": "/i/*", comment: "Invite links" },
            { "/": "/s/*", comment: "Car invitations (shared Vehicles)" },
          ],
        },
      ],
    },
  });
}
