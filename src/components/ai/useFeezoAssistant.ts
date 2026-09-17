import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  apiAiChat,
  type FeezoChatMessage,
  type FeezoLocale,
  type FeezoNavigation,
  type FeezoPendingAction,
  type FeezoUiBlock,
} from "@/lib/api/ai";
import { normalizeFeezoNavigation } from "@/lib/ai-navigation";
import {
  apiCreateDisbursement,
  apiCreateFeeBreak,
  apiCreatePayment,
  apiDeleteStaff,
  apiDeleteStudent,
  apiUpsertStaff,
  apiUpsertStudent,
} from "@/lib/api/records";
import { apiSaveSchoolDetails, apiSyncThemeSettings } from "@/lib/api/settings";
import { buildStudentFeeStatement } from "@/lib/student-fees";
import { useTenantStore, type Payment, type Staff, type Student } from "@/lib/tenant-store";

export type FeezoThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocks?: FeezoUiBlock[];
  pendingActions?: FeezoPendingAction[];
  navigations?: FeezoNavigation[];
  model?: string;
};

const STORAGE_KEY = "feezo.ai.thread.v1";

const FEE_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function uid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toHistory(messages: FeezoThreadMessage[]): FeezoChatMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

function normalizeFeePeriod(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const lower = raw.trim().toLowerCase();
  for (const month of FEE_MONTHS) {
    const full = month.toLowerCase();
    if (lower === full || lower.includes(full)) return month;
  }
  const aliases: Record<string, (typeof FEE_MONTHS)[number]> = {
    jan: "January",
    feb: "February",
    mar: "March",
    apr: "April",
    jun: "June",
    jul: "July",
    aug: "August",
    sep: "September",
    sept: "September",
    oct: "October",
    nov: "November",
    dec: "December",
  };
  for (const [alias, month] of Object.entries(aliases)) {
    if (lower === alias || new RegExp(`\\b${alias}\\b`).test(lower)) return month;
  }
  return undefined;
}

function loadPersisted(): { locale: FeezoLocale; messages: FeezoThreadMessage[] } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { locale: "en", messages: [] };
    const parsed = JSON.parse(raw) as {
      locale?: string;
      messages?: FeezoThreadMessage[];
    };
    const locale: FeezoLocale = parsed.locale === "ml" ? "ml" : "en";
    const messages = Array.isArray(parsed.messages) ? parsed.messages.slice(-80) : [];
    return { locale, messages };
  } catch {
    return { locale: "en", messages: [] };
  }
}

function persistThread(locale: FeezoLocale, messages: FeezoThreadMessage[]) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        locale,
        messages: messages.slice(-80).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          blocks: m.blocks,
          pendingActions: m.pendingActions?.filter((p) => p.status === "pending_confirmation"),
          navigations: m.navigations,
          model: m.model,
        })),
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

function isSafeTenantReturn(path: string | undefined): path is string {
  if (!path || !path.startsWith("/tenant")) return false;
  if (path === "/tenant/ai" || path.startsWith("/tenant/ai?")) return false;
  return true;
}

/** Navigate to a stored return URL like `/tenant/finance?tab=fees`. */
function navigateReturn(
  navigate: ReturnType<typeof useNavigate>,
  from: string | undefined,
) {
  if (!isSafeTenantReturn(from)) {
    void navigate({ to: "/tenant/dashboard" });
    return;
  }
  const q = from.indexOf("?");
  const path = q < 0 ? from : from.slice(0, q);
  const search: Record<string, string> = {};
  if (q >= 0) {
    new URLSearchParams(from.slice(q + 1)).forEach((value, key) => {
      if (key && value) search[key] = value;
    });
  }
  void navigate({ to: path as "/tenant/dashboard", search } as never);
}

export function useFeezoAssistant() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const fromParam = useRouterState({
    select: (s) => {
      const search = s.location.search as { from?: string };
      return typeof search?.from === "string" ? search.from : undefined;
    },
  });

  const {
    academicYear,
    students,
    payments,
    setStudents,
    setStaff,
    setPayments,
    classes,
    feeTerms,
    transportRoutes,
    studentFeeBreaks,
  } = useTenantStore();

  const open = pathname === "/tenant/ai";

  const [locale, setLocaleState] = useState<FeezoLocale>(() => loadPersisted().locale);
  const [messages, setMessages] = useState<FeezoThreadMessage[]>(() => loadPersisted().messages);
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    persistThread(locale, messages);
  }, [locale, messages]);

  const setLocale = useCallback((next: FeezoLocale) => {
    setLocaleState(next);
  }, []);

  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const want = typeof next === "function" ? next(open) : next;
      if (want === open) return;

      if (want) {
        const here =
          pathname !== "/tenant/ai"
            ? `${pathname}${searchStr || ""}`
            : isSafeTenantReturn(fromParam)
              ? fromParam
              : undefined;
        void navigate({
          to: "/tenant/ai",
          search: here ? { from: here } : {},
        } as never);
        return;
      }

      navigateReturn(navigate, fromParam);
    },
    [fromParam, navigate, open, pathname, searchStr],
  );

  const applyNavigation = useCallback(
    (nav: FeezoNavigation) => {
      const normalized = normalizeFeezoNavigation(nav);
      if (!normalized) {
        toast.error(
          locale === "ml" ? "ഈ പേജ് തുറക്കാൻ കഴിയില്ല" : "That page link is not available",
        );
        return;
      }

      // Leave /tenant/ai so the destination page is visible; chat stays in sessionStorage.
      void navigate({
        to: normalized.to,
        search: normalized.search,
      } as never);
    },
    [locale, navigate],
  );

  const send = useCallback(
    async (text: string, opts?: { historyBase?: FeezoThreadMessage[] }) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const base = opts?.historyBase ?? messages;
      const userMsg: FeezoThreadMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
      };
      const next = [...base, userMsg];
      setMessages(next);
      setBusy(true);

      try {
        const res = await apiAiChat({
          messages: toHistory(next),
          locale,
        });

        const assistant: FeezoThreadMessage = {
          id: uid(),
          role: "assistant",
          content: res.reply,
          blocks: res.blocks,
          pendingActions: res.pendingActions,
          navigations: res.navigations,
          model: res.model,
        };
        setMessages((prev) => [...prev, assistant]);
        // Keep chat open with View button / profile card — user taps View to open.
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Feezo request failed";
        toast.error(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              locale === "ml"
                ? `ക്ഷമിക്കണം — അഭ്യർത്ഥന പരാജയപ്പെട്ടു: ${msg}`
                : `Sorry — that request failed: ${msg}`,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, locale, messages],
  );

  const confirmAction = useCallback(
    async (action: FeezoPendingAction) => {
      setConfirmingId(action.id);
      try {
        switch (action.api) {
          case "students.create": {
            const saved = await apiUpsertStudent(action.payload as unknown as Student, {
              createOnly: true,
            });
            setStudents((prev) => {
              const id = saved.id;
              if (prev.some((s) => s.id === id)) {
                return prev.map((s) => (s.id === id ? saved : s));
              }
              return [saved, ...prev];
            });
            break;
          }
          case "students.update": {
            const saved = await apiUpsertStudent(action.payload as unknown as Student);
            setStudents((prev) => prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
            break;
          }
          case "students.delete": {
            const id = String(action.payload.id ?? "");
            await apiDeleteStudent(id, { hard: Boolean(action.payload.hard) });
            setStudents((prev) => prev.filter((s) => s.id !== id));
            break;
          }
          case "staff.create": {
            const saved = await apiUpsertStaff(action.payload as unknown as Staff, {
              createOnly: true,
            });
            setStaff((prev) => {
              if (prev.some((s) => s.id === saved.id)) {
                return prev.map((s) => (s.id === saved.id ? saved : s));
              }
              return [saved, ...prev];
            });
            break;
          }
          case "staff.update": {
            const saved = await apiUpsertStaff(action.payload as unknown as Staff);
            setStaff((prev) => prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
            break;
          }
          case "staff.delete": {
            const id = String(action.payload.id ?? "");
            await apiDeleteStaff(id, { hard: Boolean(action.payload.hard) });
            setStaff((prev) => prev.filter((s) => s.id !== id));
            break;
          }
          case "finance.payments.create": {
            const payload = { ...action.payload } as Record<string, unknown>;
            const studentId = payload.studentId ? String(payload.studentId) : undefined;
            const reduceDue = payload.reduceDue !== false && Boolean(studentId || payload.reduceDue);
            delete payload.reduceDue;
            delete payload.studentId;

            if (!payload.academicYear) {
              payload.academicYear = academicYear;
            }
            const student = studentId ? students.find((s) => s.id === studentId) : undefined;
            if (student) {
              if (!payload.name) payload.name = student.name;
              if (!payload.className) payload.className = student.cls;
            }
            const period =
              normalizeFeePeriod(payload.feePeriod) ||
              normalizeFeePeriod(payload.feeMonth) ||
              normalizeFeePeriod(payload.narration) ||
              normalizeFeePeriod(action.summary);
            if (period) {
              payload.feePeriod = period;
              payload.feeMonth = period;
              if (!payload.feePeriodKind) payload.feePeriodKind = "month";
              if (!payload.narration) payload.narration = `${period} fee`;
            }
            if (!payload.cat || String(payload.cat).toLowerCase() === "fees") {
              payload.cat = "Tuition Fee";
            }
            if (!payload.payerType) payload.payerType = "student";
            if (!payload.mode) payload.mode = "Cash";
            if (!payload.time) payload.time = new Date().toISOString();

            const amount = Number(payload.amount);
            if (!Number.isFinite(amount) || amount < 1) {
              throw new Error("Payment amount is missing — ask Feezo to record the amount again");
            }

            const saved = await apiCreatePayment(payload as unknown as Payment, {
              reduceDue,
              studentId,
            });

            const paymentsAfter = [saved, ...payments.filter((p) => p.id !== saved.id)];
            setPayments(paymentsAfter);

            if (studentId) {
              const selected = students.find((s) => s.id === studentId) ?? student;
              if (selected) {
                const liveDue = buildStudentFeeStatement({
                  student: selected,
                  payments: paymentsAfter,
                  classes,
                  feeTerms,
                  transportRoutes,
                  academicYear: String(saved.academicYear || academicYear),
                  feeBreaks: studentFeeBreaks,
                }).totalDue;
                setStudents((stuPrev) =>
                  stuPrev.map((s) => (s.id === studentId ? { ...s, due: liveDue } : s)),
                );
              } else if (reduceDue) {
                setStudents((stuPrev) =>
                  stuPrev.map((s) =>
                    s.id === studentId
                      ? { ...s, due: Math.max(0, (s.due || 0) - saved.amount) }
                      : s,
                  ),
                );
              }
            }
            break;
          }
          case "finance.disbursements.create":
            await apiCreateDisbursement(action.payload as never);
            break;
          case "finance.feeBreaks.create":
            await apiCreateFeeBreak(action.payload as never);
            break;
          case "settings.school": {
            const body = (action.payload.payload ?? action.payload) as never;
            await apiSaveSchoolDetails(body);
            break;
          }
          case "settings.theme": {
            const body = (action.payload.payload ?? action.payload) as never;
            await apiSyncThemeSettings(body);
            break;
          }
          default:
            if (action.api.startsWith("settings.")) {
              throw new Error(
                `Open Settings to apply “${action.summary}” manually, or ask Feezo for school/theme only.`,
              );
            }
            throw new Error(`Unsupported action: ${action.api}`);
        }

        toast.success(locale === "ml" ? "സ്ഥിരീകരിച്ചു — മാറ്റം സേവ് ചെയ്തു" : "Confirmed — change saved");
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            pendingActions: m.pendingActions?.map((pa) =>
              pa.id === action.id ? { ...pa, status: "confirmed" } : pa,
            ),
          })),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not confirm action");
      } finally {
        setConfirmingId(null);
      }
    },
    [
      academicYear,
      classes,
      feeTerms,
      locale,
      payments,
      setPayments,
      setStaff,
      setStudents,
      studentFeeBreaks,
      students,
      transportRoutes,
    ],
  );

  const dismissAction = useCallback((actionId: string) => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        pendingActions: m.pendingActions?.map((pa) =>
          pa.id === actionId ? { ...pa, status: "dismissed" } : pa,
        ),
      })),
    );
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setConfirmingId(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, messages: [] }));
    } catch {
      // ignore
    }
  }, [locale]);

  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      if (busy) return;
      const idx = messages.findIndex((m) => m.id === assistantMessageId);
      if (idx < 0) return;
      let userIdx = -1;
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i]?.role === "user") {
          userIdx = i;
          break;
        }
      }
      if (userIdx < 0) return;
      const prompt = messages[userIdx]?.content?.trim();
      if (!prompt) return;
      await send(prompt, { historyBase: messages.slice(0, userIdx) });
    },
    [busy, messages, send],
  );

  return {
    open,
    setOpen,
    locale,
    setLocale,
    messages,
    busy,
    confirmingId,
    send,
    applyNavigation,
    confirmAction,
    dismissAction,
    newChat,
    regenerate,
  };
}
