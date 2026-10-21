import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

const AttendanceToolbarContext = createContext<HTMLElement | null>(null);

export function AttendanceToolbarProvider({
  host,
  children,
}: {
  host: HTMLElement | null;
  children: ReactNode;
}) {
  return <AttendanceToolbarContext.Provider value={host}>{children}</AttendanceToolbarContext.Provider>;
}

/** Renders mark/upload controls into the full-width row beside the attendance tabs. */
export function AttendanceActions({ children }: { children: ReactNode }) {
  const host = useContext(AttendanceToolbarContext);
  if (!host) return null;
  return createPortal(children, host);
}
