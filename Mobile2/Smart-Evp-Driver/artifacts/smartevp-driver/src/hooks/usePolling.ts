import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { BACKEND_URL, POLL_INTERVAL } from "../config";
import { useAppContext, type ActiveCase } from "../context/AppContext";
import { sendLocalDispatchNotification } from "../notifications";

/**
 * Subscribes the calling screen to the SmartEVP+ dispatch poll loop while
 * mounted. Polls the backend API for state updates.
 */
export function usePolling(): void {
  const router = useRouter();
  const { setActiveCase, setIsConnected, setSignalState, setMedicalBrief } = useAppContext();
  const seenCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/mobile/state`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        
        setIsConnected(!!data.connected);
        setSignalState(data.signal_state || "RED");
        
        if (data.medical_brief) {
           setMedicalBrief(data.medical_brief);
        }

        if (data.active_case && (data.active_case.id || data.active_case.case_id)) {
          const fetchedCase: ActiveCase = {
            id: data.active_case.id || data.active_case.case_id,
            severity: data.active_case.severity || "CRITICAL",
            location: data.active_case.location || "Unknown Location",
            symptoms: data.active_case.complaint || "Emergency",
            intersection: "Signal Corridor", 
            distanceMeters: data.distance_m || 2400,
            driverHospital: data.selected_hospital?.name || "Bowring Hospital",
            mapHospital: data.hospital_recommendation?.name || "Fortis Hospital",
            hospitalChosen: "own",
            dispatchedAt: data.active_case.timestamp || Date.now(),
            etaTotalSeconds: 300,
            etaSecondsRemaining: data.eta_seconds || 300,
          };
          setActiveCase(fetchedCase);

          if (data.driver_status !== "ACCEPTED" && seenCaseIdRef.current !== fetchedCase.id) {
            seenCaseIdRef.current = fetchedCase.id;
            void sendLocalDispatchNotification(fetchedCase.id, fetchedCase.severity, fetchedCase.location);
            router.push("/alert");
          }
        } else {
          setActiveCase(null);
          seenCaseIdRef.current = null;
        }
      } catch (e) {
        setIsConnected(false);
      } finally {
        if (active) {
          setTimeout(poll, POLL_INTERVAL);
        }
      }
    }

    poll();

    return () => {
      active = false;
    };
  }, [router, setActiveCase, setIsConnected, setSignalState, setMedicalBrief]);
}

export default usePolling;
