import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearFamilyAuth,
  familyLogout,
  familyPreviewName,
  familySavePrefs,
  familySession,
  familyToken,
  type FamilyProfile,
  type FamilyStudent,
} from "@/lib/api/family";

const THEME_KEY = "feezo-family/theme";

type FamilyContextValue = {
  ready: boolean;
  signedIn: boolean;
  profile: FamilyProfile | null;
  student: FamilyStudent | null;
  theme: "light" | "dark";
  setTheme: (mode: "light" | "dark") => void;
  reload: () => Promise<void>;
  selectStudent: (id: string) => Promise<void>;
  setYear: (year: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Staff opened this tab as the parent. Null for a real parent login. */
  previewName: string | null;
  previewEnded: boolean;
  endPreview: () => Promise<void>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  confirmLeave: () => boolean;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(() =>
    localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light",
  );
  const [dirty, setDirty] = useState(false);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewEnded, setPreviewEnded] = useState(false);

  const reload = useCallback(async () => {
    if (!familyToken()) {
      setPreviewName(null);
      setProfile(null);
      return;
    }
    setPreviewName(familyPreviewName());
    const next = await familySession();
    setProfile(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          clearFamilyAuth();
          setProfile(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const setTheme = useCallback((mode: "light" | "dark") => {
    localStorage.setItem(THEME_KEY, mode);
    setThemeState(mode);
  }, []);

  const selectStudent = useCallback(async (id: string) => {
    const next = await familySavePrefs({ studentId: id });
    setProfile(next);
  }, []);

  const setYear = useCallback(async (year: string) => {
    const next = await familySavePrefs({ academicYear: year });
    setProfile(next);
  }, []);

  const signOut = useCallback(async () => {
    setDirty(false);
    await familyLogout();
    setProfile(null);
    setPreviewName(null);
  }, []);

  const endPreview = useCallback(async () => {
    setDirty(false);
    await familyLogout();
    setProfile(null);
    setPreviewName(null);
    setPreviewEnded(true);
    window.close();
  }, []);

  const confirmLeave = useCallback(() => {
    if (!dirty) return true;
    const ok = window.confirm("You have unsaved changes. Leave this form?");
    if (ok) setDirty(false);
    return ok;
  }, [dirty]);

  const student = useMemo(() => {
    if (!profile?.students.length) return null;
    return (
      profile.students.find((item) => item.id === profile.selectedStudentId) ?? profile.students[0]
    );
  }, [profile]);

  const value = useMemo<FamilyContextValue>(
    () => ({
      ready,
      signedIn: Boolean(profile),
      profile,
      student,
      theme,
      setTheme,
      reload,
      selectStudent,
      setYear,
      signOut,
      previewName,
      previewEnded,
      endPreview,
      dirty,
      setDirty,
      confirmLeave,
    }),
    [ready, profile, student, theme, setTheme, reload, selectStudent, setYear, signOut, previewName, previewEnded, endPreview, dirty, confirmLeave],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside FamilyProvider");
  return ctx;
}
