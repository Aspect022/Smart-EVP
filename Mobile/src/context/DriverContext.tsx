import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

import { DriverProfile } from "../types";

type DriverContextValue = {
  driver: DriverProfile | null;
  setDriver: (driver: DriverProfile | null) => void;
};

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

export function DriverProvider({ children }: PropsWithChildren) {
  const [driver, setDriver] = useState<DriverProfile | null>(null);

  const value = useMemo(
    () => ({
      driver,
      setDriver,
    }),
    [driver],
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const value = useContext(DriverContext);
  if (!value) {
    throw new Error("useDriver must be used inside DriverProvider");
  }
  return value;
}

