"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket, getBackendUrl } from "@/lib/socket";

export type CaseStatus = "CALL_RECEIVED" | "DISPATCHED" | "EN_ROUTE_PATIENT" | "PATIENT_PICKED" | "EN_ROUTE_HOSPITAL" | "ARRIVING";

export type RlDecision = {
  trigger_distance_m: number;
  green_duration_s: number;
  traffic_density: number;
  ambulance_speed_kmh: number;
  mode: string;
  model: string;
  inference_ms: number;
  fixed_rule: { trigger_distance_m: number; green_duration_s: number };
  efficiency_gain_pct: number;
  trigger_delta_pct: number;
  green_delta_pct: number;
};

export type Hospital = {
  id: string;
  name: string;
  short_name: string;
  lat: number;
  lng: number;
  specialties: string[];
  type: string;
  beds_icu: number;
  distance_km?: number;
  score?: number;
  reasoning?: string;
  tag?: string;
};

export type HospitalRecommendation = {
  recommended: Hospital | null;
  alternatives: Hospital[];
  all_ranked: Hospital[];
  nearby_count: number;
  ai_model_used: string;
  ai_reasoning: string;
};

// Default state structure
export type AppState = {
  connected: boolean;
  gps: any | null;
  signal: "RED" | "AMBER" | "GREEN";
  latency: number | null;
  case: any | null;
  caseStatus: CaseStatus;
  brief: any | null;
  transcript: string;
  distance: number | null;
  etaSeconds: number | null;
  preemptionCount: number;
  rlDecision: RlDecision | null;
  trafficDensity: number;
  hospitalRecommendation: HospitalRecommendation | null;
  selectedHospital: Hospital | null;
};

const defaultState: AppState = {
  connected: false,
  gps: null,
  signal: "RED",
  latency: null,
  case: null,
  caseStatus: "CALL_RECEIVED",
  brief: null,
  transcript: "",
  distance: null,
  etaSeconds: null,
  preemptionCount: 0,
  rlDecision: null,
  trafficDensity: 0.5,
  hospitalRecommendation: null,
  selectedHospital: null,
};

function normalizeSnapshot(snapshot: any): Partial<AppState> {
  return {
    connected: Boolean(snapshot?.connected),
    gps: snapshot?.gps ?? null,
    signal: snapshot?.signal ?? "RED",
    latency: snapshot?.latency ?? null,
    case: snapshot?.case ?? null,
    caseStatus: snapshot?.caseStatus ?? snapshot?.case_status ?? "CALL_RECEIVED",
    brief: snapshot?.brief ?? null,
    transcript: snapshot?.transcript ?? "",
    distance: snapshot?.distance ?? null,
    etaSeconds: snapshot?.etaSeconds ?? snapshot?.eta_seconds ?? null,
    preemptionCount: snapshot?.preemptionCount ?? 0,
    rlDecision: snapshot?.rl_decision ?? null,
    trafficDensity: snapshot?.traffic_density ?? 0.5,
    hospitalRecommendation: snapshot?.hospital_recommendation ?? null,
    selectedHospital: snapshot?.selected_hospital ?? null,
  };
}

export function useSocket() {
  const [state, setState] = useState<AppState>(defaultState);
  const [auditLog, setAuditLog] = useState<{ ts: string; event: string; data: string }[]>([]);
  
  // Custom hook ref to avoid stale state in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const addLogEntry = useCallback((event: string, data: string) => {
    const ts = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setAuditLog((prev) => [{ ts, event, data }, ...prev].slice(0, 100));
  }, []);

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/state`);
      if (!response.ok) return;
      const snapshot = await response.json();
      const normalized = normalizeSnapshot(snapshot);
      setState((prev) => ({
        ...prev,
        ...normalized,
        connected: prev.connected || Boolean(normalized.connected),
        preemptionCount: normalized.preemptionCount || prev.preemptionCount,
      }));
    } catch {
      // Keep socket as primary path; this is just a resilience fallback.
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    // Enable manual connection
    socket.connect();

    // Named handlers so we can cleanly remove exactly them in cleanup
    const onConnect = () => {
      console.log("Connected to SmartEVP+ Backend");
      setState((prev) => ({ ...prev, connected: true }));
      addLogEntry("SYSTEM", "Connected to Backend Server");
    };
    const onDisconnect = () => {
      console.log("Disconnected from SmartEVP+ Backend");
      setState((prev) => ({ ...prev, connected: false }));
      addLogEntry("SYSTEM", "Disconnected from Backend Server");
    };
    const onConnectError = (err: Error) => {
      console.error("Socket Connect Error:", err);
      setState((prev) => ({ ...prev, connected: false }));
    };

    const onInitialState = (initialState: any) => {
      const normalized = normalizeSnapshot(initialState);
      setState((prev) => ({
        ...prev,
        ...normalized,
        connected: true,
        preemptionCount: normalized.preemptionCount || prev.preemptionCount,
      }));
    };
    const onDemoReset = (resetState: any) => {
      const normalized = normalizeSnapshot(resetState);
      setState((prev) => ({ ...prev, ...normalized, connected: true, preemptionCount: 0 }));
      setAuditLog([]);
      addLogEntry("SYSTEM", "System state reset");
    };
    const onGpsUpdate = (gpsData: any) => setState((prev) => ({ ...prev, gps: gpsData }));
    const onDistanceUpdate = (data: any) => setState((prev) => ({ ...prev, distance: data.distance_m }));
    const onNewCase = (caseData: any) => {
      setState((prev) => ({ ...prev, case: caseData, caseStatus: "CALL_RECEIVED" }));
      addLogEntry("CASE_OPENED", `${caseData.id} — ${caseData.severity} — ${caseData.location}`);
    };
    const onCaseStatusUpdate = (data: { status: CaseStatus }) => {
      setState((prev) => ({ ...prev, caseStatus: data.status }));
      addLogEntry("STATUS_UPDATE", `Case status shifted to ${data.status.replace(/_/g, " ")}`);
    };
    const onEtaUpdate = (data: { etaSeconds: number | null }) => {
      setState((prev) => ({ ...prev, etaSeconds: data.etaSeconds }));
    };
    const onSmsDispatch = (data: any) => addLogEntry("SMS_SENT", `${data.ambulance} driver notified`);
    const onSignalUpdate = (signalData: any) => {
      setState((prev) => ({
        ...prev,
        signal: signalData.state,
        latency: signalData.latency_ms,
        preemptionCount: signalData.state === "GREEN" ? prev.preemptionCount + 1 : prev.preemptionCount,
      }));
      if (signalData.state === "GREEN") {
        addLogEntry("SIGNAL_GREEN", `Intersection PREEMPTED — Latency ${signalData.latency_ms}ms`);
      } else if (signalData.state === "RED") {
        addLogEntry("SIGNAL_RESET", "Intersection returned to RED mode");
      }
    };
    const onTranscript = (data: { text: string }) => setState((prev) => ({ ...prev, transcript: data.text }));
    const onMedicalBrief = (brief: any) => {
      setState((prev) => ({ ...prev, brief }));
      addLogEntry("MEDICAL_BRIEF", "Gemma Edge AI brief generated");
    };
    const onRlDecision = (data: RlDecision) => {
      setState((prev) => ({ ...prev, rlDecision: data, trafficDensity: data.traffic_density }));
    };
    const onHospitalRecommendation = (data: HospitalRecommendation) => {
      setState((prev) => ({
        ...prev,
        hospitalRecommendation: data,
        selectedHospital: data.recommended ?? prev.selectedHospital,
      }));
      addLogEntry("HOSPITAL", `AI selected: ${data.recommended?.short_name ?? 'unknown'} (${data.ai_model_used})`);
    };
    const onHospitalSelected = (hospital: Hospital) => {
      setState((prev) => ({ ...prev, selectedHospital: hospital }));
      addLogEntry("HOSPITAL_OVERRIDE", `Driver selected: ${hospital.short_name ?? hospital.name}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("initial_state", onInitialState);
    socket.on("demo_reset", onDemoReset);
    socket.on("gps_update", onGpsUpdate);
    socket.on("distance_update", onDistanceUpdate);
    socket.on("new_case", onNewCase);
    socket.on("case_status_update", onCaseStatusUpdate);
    socket.on("eta_update", onEtaUpdate);
    socket.on("dispatch_sms", onSmsDispatch);
    socket.on("signal_update", onSignalUpdate);
    socket.on("transcript_update", onTranscript);
    socket.on("medical_brief", onMedicalBrief);
    socket.on("rl_decision", onRlDecision);
    socket.on("hospital_recommendation", onHospitalRecommendation);
    socket.on("hospital_selected", onHospitalSelected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("initial_state", onInitialState);
      socket.off("demo_reset", onDemoReset);
      socket.off("gps_update", onGpsUpdate);
      socket.off("distance_update", onDistanceUpdate);
      socket.off("new_case", onNewCase);
      socket.off("case_status_update", onCaseStatusUpdate);
      socket.off("eta_update", onEtaUpdate);
      socket.off("dispatch_sms", onSmsDispatch);
      socket.off("signal_update", onSignalUpdate);
      socket.off("transcript_update", onTranscript);
      socket.off("medical_brief", onMedicalBrief);
      socket.off("rl_decision", onRlDecision);
      socket.off("hospital_recommendation", onHospitalRecommendation);
      socket.off("hospital_selected", onHospitalSelected);
      socket.disconnect();
    };
  }, [addLogEntry]);

  useEffect(() => {
    void refreshSnapshot();
    const timer = window.setInterval(() => {
      void refreshSnapshot();
    }, 1500);

    return () => window.clearInterval(timer);
  }, [refreshSnapshot]);

  // Emit traffic density to backend RL engine via Socket.IO
  const setTrafficDensity = useCallback((density: number) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("rl_set_density", { density });
    }
    setState((prev) => ({ ...prev, trafficDensity: density }));
  }, []);

  // Driver hospital override
  const selectHospital = useCallback(async (hospitalId: string, hospitalName?: string) => {
    try {
      await fetch(`${getBackendUrl()}/api/hospital/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospital_id: hospitalId, name: hospitalName }),
      });
    } catch (e) {
      console.error("Failed to select hospital", e);
    }
  }, []);

  // Method to request manual reset via API
  const resetDemo = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/api/reset`, { method: "POST" });
    } catch (e) {
      console.error("Failed to reset backend state", e);
    }
  }, []);

  return {
    ...state,
    auditLog,
    addLogEntry,
    resetDemo,
    setTrafficDensity,
    selectHospital,
  };
}
