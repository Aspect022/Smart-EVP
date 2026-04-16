import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type LanguageCode = "en" | "hi" | "kn";

const strings = {
  en: {
    hello: "Hello",
    available: "AVAILABLE",
    waitingDispatch: "Waiting for dispatch...",
    casesToday: "Cases Today",
    hoursShift: "Hours on Shift",
    distance: "Distance",
    connected: "Connected to SmartEVP+",
    reconnecting: "Reconnecting...",
    dispatchAlert: "DISPATCH ALERT",
    location: "Location",
    symptoms: "Symptoms",
    accept: "Accept Dispatch",
    back: "Back",
    signal: "Signal Corridor",
    overview: "Overview",
    patientBrief: "Patient Brief",
    activeCase: "Active Case",
    profile: "Driver Profile",
  },
  hi: {
    hello: "नमस्ते",
    available: "उपलब्ध",
    waitingDispatch: "डिस्पैच का इंतज़ार...",
    casesToday: "आज के केस",
    hoursShift: "शिफ्ट घंटे",
    distance: "दूरी",
    connected: "SmartEVP+ से जुड़ा",
    reconnecting: "पुनः जुड़ रहा है...",
    dispatchAlert: "डिस्पैच अलर्ट",
    location: "स्थान",
    symptoms: "लक्षण",
    accept: "स्वीकार करें",
    back: "वापस",
    signal: "सिग्नल कॉरिडोर",
    overview: "सारांश",
    patientBrief: "रोगी संक्षेप",
    activeCase: "सक्रिय केस",
    profile: "ड्राइवर प्रोफाइल",
  },
  kn: {
    hello: "ನಮಸ್ಕಾರ",
    available: "ಲಭ್ಯ",
    waitingDispatch: "ಡಿಸ್ಪ್ಯಾಚ್‌ಗಾಗಿ ಕಾಯುತ್ತಿದೆ...",
    casesToday: "ಇಂದಿನ ಕೇಸ್‌ಗಳು",
    hoursShift: "ಶಿಫ್ಟ್ ಗಂಟೆಗಳು",
    distance: "ದೂರ",
    connected: "SmartEVP+ ಗೆ ಸಂಪರ್ಕಿತ",
    reconnecting: "ಮರುಸಂಪರ್ಕಿಸುತ್ತಿದೆ...",
    dispatchAlert: "ಡಿಸ್ಪ್ಯಾಚ್ ಎಚ್ಚರಿಕೆ",
    location: "ಸ್ಥಳ",
    symptoms: "ಲಕ್ಷಣಗಳು",
    accept: "ಸ್ವೀಕರಿಸಿ",
    back: "ಹಿಂದೆ",
    signal: "ಸಿಗ್ನಲ್ ಕಾರಿಡಾರ್",
    overview: "ಸಾರಾಂಶ",
    patientBrief: "ರೋಗಿ ಸಾರಾಂಶ",
    activeCase: "ಸಕ್ರಿಯ ಕೇಸ್",
    profile: "ಡ್ರೈವರ್ ಪ್ರೊಫೈಲ್",
  },
} as const;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: keyof (typeof strings)["en"]) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof (typeof strings)["en"]) => strings[language][key] ?? strings.en[key] ?? key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return value;
}

