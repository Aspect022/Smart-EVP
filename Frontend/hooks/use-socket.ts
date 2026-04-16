"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket, getBackendUrl } from "@/lib/socket";

export type CaseStatus = "CALL_RECEIVED" | "DISPATCHED" | "EN_ROUTE_PATIENT" | "PATIENT_PICKED" | "EN_ROUTE_HOSPITAL" | "ARRIVING";

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
};

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
      setState((prev) => ({
        ...prev,
        ...snapshot,
        connected: prev.connected || Boolean(snapshot.connected),
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
      setState((prev) => ({ ...prev, ...initialState, connected: true, preemptionCount: prev.preemptionCount }));
    };
    const onDemoReset = (resetState: any) => {
      setState((prev) => ({ ...prev, ...resetState, connected: true, preemptionCount: 0 }));
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
      addLogEntry("MEDICAL_BRIEF", "Gemma 4 Edge AI brief generated");
    };

    // Register all handlers
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
      socket.disconnect();
    };
  }, [addLogEntry]);

  useEffect(() => {
    void refreshSnapshot();
    const timer = window.setInterval(() => {
      void refreshSnapshot();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [refreshSnapshot]);

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
    resetDemo
  };
}
