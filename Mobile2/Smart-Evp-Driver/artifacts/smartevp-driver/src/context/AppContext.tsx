import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Driver = {
  id: string;
  name: string;
  vehicle: string;
  license: string;
};

export type Language = "en" | "hi" | "kn";

export type SignalState = "RED" | "GREEN";

export type CaseSeverity = "critical" | "serious" | "stable";

export type ActiveCase = {
  id: string;
  intersection: string;
  distanceMeters: number;
  location: string;
  symptoms: string;
  severity: CaseSeverity;
  driverHospital: string;
  mapHospital: string;
  hospitalChosen: "own" | "map";
  dispatchedAt: number;
  etaTotalSeconds: number;
  etaSecondsRemaining: number;
  latencyMs?: number;
};

export type Vitals = {
  bp: string;
  hr: string;
  spo2: string;
  gcs: string;
};

export type MedicalBrief = {
  patient: { name: string; age: number; sex: "M" | "F" };
  chiefComplaint: string;
  suspectedDiagnosis: string;
  vitals: Vitals;
  resources: string[];
  medications: string[];
  allergies: string[];
};

export type AppContextValue = {
  driver: Driver | null;
  setDriver: (driver: Driver | null) => void;

  language: Language;
  setLanguage: (language: Language) => void;

  activeCase: ActiveCase | null;
  setActiveCase: (activeCase: ActiveCase | null) => void;

  signalState: SignalState;
  setSignalState: (signalState: SignalState) => void;

  medicalBrief: MedicalBrief | null;
  setMedicalBrief: (medicalBrief: MedicalBrief | null) => void;

  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [activeCase, setActiveCase] = useState<ActiveCase | null>(null);
  const [signalState, setSignalState] = useState<SignalState>("RED");
  const [medicalBrief, setMedicalBrief] = useState<MedicalBrief | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  React.useEffect(() => {
    import("../notifications").then(({ registerForPushNotificationsAsync }) => {
      void registerForPushNotificationsAsync();
    });
  }, []);

  const setDriverCb = useCallback((d: Driver | null) => setDriver(d), []);
  const setLanguageCb = useCallback((l: Language) => setLanguage(l), []);
  const setActiveCaseCb = useCallback(
    (c: ActiveCase | null) => setActiveCase(c),
    [],
  );
  const setSignalStateCb = useCallback(
    (s: SignalState) => setSignalState(s),
    [],
  );
  const setMedicalBriefCb = useCallback(
    (b: MedicalBrief | null) => setMedicalBrief(b),
    [],
  );
  const setIsConnectedCb = useCallback(
    (c: boolean) => setIsConnected(c),
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      driver,
      setDriver: setDriverCb,
      language,
      setLanguage: setLanguageCb,
      activeCase,
      setActiveCase: setActiveCaseCb,
      signalState,
      setSignalState: setSignalStateCb,
      medicalBrief,
      setMedicalBrief: setMedicalBriefCb,
      isConnected,
      setIsConnected: setIsConnectedCb,
    }),
    [
      driver,
      language,
      activeCase,
      signalState,
      medicalBrief,
      isConnected,
      setDriverCb,
      setLanguageCb,
      setActiveCaseCb,
      setSignalStateCb,
      setMedicalBriefCb,
      setIsConnectedCb,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
}

export default AppContext;
