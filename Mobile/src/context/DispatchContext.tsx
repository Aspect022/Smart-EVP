import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { acceptCase, getMobileState } from "../api";
import { ActiveCase, DriverProfile, MedicalBrief } from "../types";

type DispatchContextValue = {
  connected: boolean;
  loading: boolean;
  activeCase: ActiveCase | null;
  medicalBrief: MedicalBrief;
  transcript: string;
  signalState: "RED" | "AMBER" | "GREEN";
  distanceM: number | null;
  etaSeconds: number | null;
  driverStatus: string;
  pendingAlertCaseId: string | null;
  accepting: boolean;
  refresh: () => Promise<void>;
  acceptCurrentCase: (driver: DriverProfile) => Promise<void>;
  clearPendingAlert: () => void;
};

const DispatchContext = createContext<DispatchContextValue | undefined>(undefined);

function normalizeCase(input: Record<string, unknown> | null): ActiveCase | null {
  if (!input) {
    return null;
  }

  return {
    id: String(input.id ?? input.case_id ?? ""),
    severity: String(input.severity ?? "UNKNOWN"),
    location: String(input.location ?? "Unknown Location"),
    complaint: String(input.complaint ?? input.symptoms ?? "Emergency"),
    ambulanceId: input.ambulanceId ? String(input.ambulanceId) : input.ambulance_id ? String(input.ambulance_id) : undefined,
    timestamp: typeof input.timestamp === "number" ? input.timestamp : typeof input.ts === "number" ? input.ts : undefined,
  };
}

export function DispatchProvider({ children }: PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<ActiveCase | null>(null);
  const [medicalBrief, setMedicalBrief] = useState<MedicalBrief>(null);
  const [transcript, setTranscript] = useState("");
  const [signalState, setSignalState] = useState<"RED" | "AMBER" | "GREEN">("RED");
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [driverStatus, setDriverStatus] = useState("AVAILABLE");
  const [pendingAlertCaseId, setPendingAlertCaseId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const seenAlertCaseIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await getMobileState();
      const nextCase = normalizeCase(next.active_case);
      const nextCaseId = nextCase?.id ?? null;

      setConnected(Boolean(next.connected));
      setActiveCase(nextCase);
      setMedicalBrief(next.medical_brief ?? null);
      setTranscript(next.transcript ?? "");
      setSignalState(next.signal_state ?? "RED");
      setDistanceM(next.distance_m ?? null);
      setEtaSeconds(next.eta_seconds ?? null);
      setDriverStatus(next.driver_status ?? "AVAILABLE");

      if (!nextCaseId) {
        seenAlertCaseIdRef.current = null;
        setPendingAlertCaseId(null);
      } else if (next.driver_status === "ACCEPTED") {
        seenAlertCaseIdRef.current = nextCaseId;
        setPendingAlertCaseId(null);
      } else if (seenAlertCaseIdRef.current !== nextCaseId) {
        setPendingAlertCaseId(nextCaseId);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 2000);

    return () => clearInterval(timer);
  }, [refresh]);

  const acceptCurrentCase = useCallback(
    async (driver: DriverProfile) => {
      if (!activeCase?.id) {
        return;
      }

      setAccepting(true);
      try {
        await acceptCase(activeCase.id, driver.id, driver.name);
        seenAlertCaseIdRef.current = activeCase.id;
        setPendingAlertCaseId(null);
        setDriverStatus("ACCEPTED");
        await refresh();
      } finally {
        setAccepting(false);
      }
    },
    [activeCase, refresh],
  );

  const clearPendingAlert = useCallback(() => {
    if (activeCase?.id) {
      seenAlertCaseIdRef.current = activeCase.id;
    }
    setPendingAlertCaseId(null);
  }, [activeCase]);

  const value = useMemo(
    () => ({
      connected,
      loading,
      activeCase,
      medicalBrief,
      transcript,
      signalState,
      distanceM,
      etaSeconds,
      driverStatus,
      pendingAlertCaseId,
      accepting,
      refresh,
      acceptCurrentCase,
      clearPendingAlert,
    }),
    [
      accepting,
      activeCase,
      clearPendingAlert,
      connected,
      distanceM,
      driverStatus,
      etaSeconds,
      loading,
      medicalBrief,
      pendingAlertCaseId,
      refresh,
      signalState,
      transcript,
      acceptCurrentCase,
    ],
  );

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export function useDispatchState() {
  const value = useContext(DispatchContext);
  if (!value) {
    throw new Error("useDispatchState must be used inside DispatchProvider");
  }
  return value;
}
