import { BACKEND_URL } from "../config/env";
import { MobileStateResponse } from "../types";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getMobileState() {
  return requestJson<MobileStateResponse>("/api/mobile/state");
}

export function acceptCase(caseId: string, driverId: string, driverName: string) {
  return requestJson<{ status: string; payload: Record<string, unknown> }>("/api/driver/accept", {
    method: "POST",
    body: JSON.stringify({
      case_id: caseId,
      driver_id: driverId,
      driver_name: driverName,
    }),
  });
}

export function registerPushToken(token: string, platform: string) {
  return requestJson<{ status: string; count: number }>("/api/mobile/push-token", {
    method: "POST",
    body: JSON.stringify({
      token,
      platform,
    }),
  });
}
