"use client";

import { createContext, useContext, useState } from "react";

type DashboardCtx = {
  activeId: string;
  setActiveId: (id: string) => void;
};

const DashboardContext = createContext<DashboardCtx | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState("ineer"); // dashboard inicial

  return (
    <DashboardContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard fora do Provider");
  return ctx;
}
