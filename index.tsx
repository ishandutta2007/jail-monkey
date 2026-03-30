// @ts-nocheck
import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'jail-monkey' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// Prefer TurboModule when available.
// Expo SDK / RN setup can make `global.__turboModuleProxy` unreliable, so
// we attempt to load the TurboModule and fall back to legacy NativeModules.
let turboModule: any = null;
try {
  // This will throw if the TurboModule isn't registered/available.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  turboModule = require('./specs/NativeJailMonkey.ts').default;
} catch {
  turboModule = null;
}

if (turboModule != null) {
  // fall through to the `exported` constant below
}

const legacy = NativeModules.JailMonkey;
const wrapBool = (v: any) =>
  typeof v === 'function' ? v : () => Boolean(v);

const source = turboModule ?? legacy;

// Both TurboModule and legacy NativeModules may expose values from
// `constantsToExport` as plain booleans instead of functions. Wrap them
// so callers can consistently use `JailMonkey.isJailBroken()` etc.
const exported = {
  jailBrokenMessage:
    typeof source?.jailBrokenMessage === 'function'
      ? source.jailBrokenMessage
      : () => String(source?.jailBrokenMessage ?? ''),
  isJailBroken: wrapBool(source?.isJailBroken),
  canMockLocation: wrapBool(source?.canMockLocation),
  trustFall: wrapBool(source?.trustFall ?? false),
  hookDetected: wrapBool(source?.hookDetected ?? false),
  isOnExternalStorage: wrapBool(source?.isOnExternalStorage ?? false),
  AdbEnabled: wrapBool(source?.AdbEnabled ?? false),
  isDebuggedMode:
    typeof source?.isDebuggedMode === 'function'
      ? source.isDebuggedMode
      : async () => false,
  isDevelopmentSettingsMode:
    typeof source?.isDevelopmentSettingsMode === 'function'
      ? source.isDevelopmentSettingsMode
      : async () => false,
  rootedDetectionMethods:
    typeof source?.rootedDetectionMethods === 'function'
      ? source.rootedDetectionMethods
      : undefined,
};
export default exported;
