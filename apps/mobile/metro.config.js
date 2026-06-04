// Monorepo-aware Metro config — https://docs.expo.dev/guides/monorepos/
// wrapped with NativeWind so Tailwind classes compile from the shared tokens.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Also watch the monorepo root so Metro can see the workspace packages (@glovebox/*),
//    while preserving Expo's default watch folders.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

// 2. Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
