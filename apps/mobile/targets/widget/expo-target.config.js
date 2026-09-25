/**
 * The lock-screen and home-screen widget (WidgetKit), linked into the iOS project by
 * @bacons/apple-targets at prebuild. It reads what the app last published to the shared App
 * Group (lib/widget.ts) and counts the days down itself, so it stays right without the app open.
 *
 * The colours mirror packages/ui tokens; this file is CommonJS and cannot import them.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: "widget",
  name: "GloveboxWidget",
  displayName: "Glovebox",
  bundleIdentifier: ".widget",
  // Lock-screen widgets arrived in iOS 16.
  deploymentTarget: "16.0",
  colors: {
    $accent: "#C4954C",
    $widgetBackground: "#07100C",
    ink: "#07100C",
    copper: "#C4954C",
    ivory: "#F4F1EA",
    muted: "#9AA79C",
    valid: "#5FCF9A",
    expiring: "#E3A93A",
    expired: "#E0705C",
  },
  entitlements: {
    "com.apple.security.application-groups": config.ios.entitlements["com.apple.security.application-groups"],
  },
});
