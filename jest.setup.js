// Eagerly resolve Expo's lazy global polyfills so their internal
// `require()` calls happen during setup (inside test scope) rather than
// during Jest teardown — otherwise Jest throws
// "You are trying to import a file outside of the scope of the test code".
// See node_modules/expo/src/winter/installGlobal.ts and runtime.native.ts.
const LAZY_EXPO_GLOBALS = [
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'URL',
  'URLSearchParams',
  '__ExpoImportMetaRegistry',
  'structuredClone',
];
for (const name of LAZY_EXPO_GLOBALS) {
  // Touch the getter to force the lazy require() to run now.
  void globalThis[name];
}
