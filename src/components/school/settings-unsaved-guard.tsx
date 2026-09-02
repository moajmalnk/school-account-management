import { Loader2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type SettingsUnsavedRegistration = {
  dirty: boolean;
  title: string;
  description: string;
  save: () => Promise<boolean>;
  discard: () => void;
};

type SettingsUnsavedContextValue = {
  register: (registration: SettingsUnsavedRegistration | null) => void;
  tryNavigate: (action: () => void) => void;
  isDirty: () => boolean;
};

const SettingsUnsavedContext = createContext<SettingsUnsavedContextValue | null>(null);

export function SettingsUnsavedProvider({ children }: { children: ReactNode }) {
  const registrationRef = useRef<SettingsUnsavedRegistration | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogCopy, setDialogCopy] = useState({ title: "", description: "" });

  const register = useCallback((registration: SettingsUnsavedRegistration | null) => {
    registrationRef.current = registration;
  }, []);

  const isDirty = useCallback(() => Boolean(registrationRef.current?.dirty), []);

  const tryNavigate = useCallback((action: () => void) => {
    const registration = registrationRef.current;
    if (!registration?.dirty) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setDialogCopy({
      title: registration.title,
      description: registration.description,
    });
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    pendingActionRef.current = null;
  }, []);

  const handleDiscard = useCallback(() => {
    registrationRef.current?.discard();
    setDialogOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  const handleSave = useCallback(async () => {
    const registration = registrationRef.current;
    if (!registration) return;
    setSaving(true);
    try {
      const ok = await registration.save();
      if (!ok) return;
      setDialogOpen(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action?.();
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <SettingsUnsavedContext.Provider value={{ register, tryNavigate, isDirty }}>
      {children}
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !saving) closeDialog();
        }}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[20px] font-semibold text-black dark:text-zinc-50">
              {dialogCopy.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              {dialogCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-0">
            <AlertDialogCancel disabled={saving} className="mt-0 w-full rounded-full sm:w-auto">
              Keep editing
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleDiscard}
              className="w-full rounded-full sm:w-auto"
            >
              Discard changes
            </Button>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void handleSave();
              }}
              className="w-full rounded-full bg-[#0F766E] hover:bg-[#0D9488] sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save & continue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsUnsavedContext.Provider>
  );
}

export function useSettingsUnsavedGuard() {
  const ctx = useContext(SettingsUnsavedContext);
  if (!ctx) {
    throw new Error("useSettingsUnsavedGuard must be used within SettingsUnsavedProvider");
  }
  return ctx;
}

export function useOptionalSettingsUnsavedGuard() {
  return useContext(SettingsUnsavedContext);
}

export function useSettingsUnsavedRegistration(registration: SettingsUnsavedRegistration | null) {
  const ctx = useOptionalSettingsUnsavedGuard();
  const saveRef = useRef(registration?.save);
  const discardRef = useRef(registration?.discard);
  saveRef.current = registration?.save;
  discardRef.current = registration?.discard;

  useEffect(() => {
    if (!ctx) return;
    if (!registration?.dirty) {
      ctx.register(null);
      return;
    }
    ctx.register({
      dirty: true,
      title: registration.title,
      description: registration.description,
      save: () => saveRef.current?.() ?? Promise.resolve(false),
      discard: () => discardRef.current?.(),
    });
    return () => ctx.register(null);
  }, [
    ctx,
    registration?.dirty,
    registration?.title,
    registration?.description,
    registration?.save,
    registration?.discard,
  ]);
}

export function useTenantNavigationGuard() {
  const ctx = useOptionalSettingsUnsavedGuard();
  const navigate = useNavigate();

  const guardedNavigate = useCallback(
    (to: string) => {
      const run = () => navigate({ to });
      if (ctx?.isDirty()) {
        ctx.tryNavigate(run);
        return;
      }
      run();
    },
    [ctx, navigate],
  );

  const onGuardedLinkClick = useCallback(
    (to: string, event: MouseEvent, isActive = false) => {
      if (isActive || !ctx?.isDirty()) return;
      event.preventDefault();
      ctx.tryNavigate(() => navigate({ to }));
    },
    [ctx, navigate],
  );

  return { guardedNavigate, onGuardedLinkClick, isDirty: ctx?.isDirty() ?? false, tryNavigate: ctx?.tryNavigate };
}
