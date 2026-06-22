const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block test tooling (vite/vitest) and test files from the app bundle
config.resolver.blockList = [
  /node_modules\/vite\/.*/,
  /node_modules\/vitest\/.*/,
  /.*\.(test|spec)\.(ts|tsx|js|jsx)$/,
];

module.exports = config;
