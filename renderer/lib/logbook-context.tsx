import { createContext, useContext } from "react";
import type { LogbookContext } from "./use-logbook";

export const LogbookCtx = createContext<LogbookContext | null>(null);

export function useLogbookCtx(): LogbookContext {
  const ctx = useContext(LogbookCtx);
  if (!ctx) throw new Error("useLogbookCtx must be used within LogbookCtx.Provider");
  return ctx;
}
