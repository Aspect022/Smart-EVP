import Constants from "expo-constants";

function inferBackendUrl() {
  const explicit = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const extraBackendUrl = (Constants.expoConfig?.extra as { backendUrl?: string } | undefined)?.backendUrl;
  if (extraBackendUrl) {
    return extraBackendUrl;
  }

  const debuggerHost =
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    ((Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost as string | undefined);

  const host = debuggerHost?.split(":")[0];
  if (host) {
    return `http://${host}:8080`;
  }

  return "http://localhost:8080";
}

export const BACKEND_URL = inferBackendUrl();

