module.exports = function (api) {
  api.cache(true);
  return {
    // jsxImportSource: nativewind lets `className` work on RN components.
    // babel-preset-expo auto-adds the react-native-reanimated plugin when installed.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
