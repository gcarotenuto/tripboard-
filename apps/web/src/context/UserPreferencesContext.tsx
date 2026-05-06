"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DateFormatPref } from "@tripboard/shared";
import { formatDateByPref } from "@tripboard/shared";

interface UserPreferences {
  defaultCurrency: string;
  dateFormat: DateFormatPref;
}

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  /** Format a date using the user's preferred date format */
  fmtDate: (date: string | Date, timezone?: string) => string;
  /** Update preferences optimistically (called after a save) */
  updatePreferences: (patch: Partial<UserPreferences>) => void;
}

const DEFAULT_PREFS: UserPreferences = {
  defaultCurrency: "USD",
  dateFormat: "MDY",
};

const UserPreferencesContext = createContext<UserPreferencesContextValue>({
  preferences: DEFAULT_PREFS,
  fmtDate: (d) => formatDateByPref(d, "MDY"),
  updatePreferences: () => {},
});

interface UserPreferencesProviderProps {
  children: React.ReactNode;
  /** Initial preferences passed from the server component to avoid a client-side fetch flash */
  initialPreferences?: Partial<UserPreferences>;
}

export function UserPreferencesProvider({ children, initialPreferences }: UserPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...DEFAULT_PREFS,
    ...initialPreferences,
  });

  // Sync from API on mount (in case server didn't pass initial prefs)
  useEffect(() => {
    if (initialPreferences?.dateFormat && initialPreferences?.defaultCurrency) return;
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.preferences) {
          setPreferences((prev) => ({ ...prev, ...data.preferences }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const fmtDate = useCallback(
    (date: string | Date, timezone?: string) =>
      formatDateByPref(date, preferences.dateFormat, timezone),
    [preferences.dateFormat],
  );

  return (
    <UserPreferencesContext.Provider value={{ preferences, fmtDate, updatePreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}

/** Convenience hook — returns a date formatter that respects the user's preferred format. */
export function useFormatDate() {
  return useContext(UserPreferencesContext).fmtDate;
}
