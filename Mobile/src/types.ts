export type DriverProfile = {
  id: string;
  name: string;
  license: string;
  vehicle: string;
};

export type ActiveCase = {
  id: string;
  severity: string;
  location: string;
  complaint: string;
  ambulanceId?: string;
  timestamp?: number;
};

export type MedicalBrief = Record<string, unknown> | null;

export type MobileStateResponse = {
  connected: boolean;
  signal_state: "RED" | "AMBER" | "GREEN";
  active_case: Record<string, unknown> | null;
  medical_brief: MedicalBrief;
  transcript: string;
  distance_m: number | null;
  eta_seconds: number | null;
  driver_status: string;
  driver: Record<string, unknown> | null;
  gps: Record<string, unknown> | null;
};

