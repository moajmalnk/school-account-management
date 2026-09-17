import { Loader2, Maximize2, MessageSquarePlus, Mic, MicOff, Minimize2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FeezoConfirmCard } from "@/components/ai/FeezoConfirmCard";
import { FeezoMessageActions } from "@/components/ai/FeezoMessageActions";
import { FeezoMessageRenderer } from "@/components/ai/FeezoMessageRenderer";
import type { useFeezoAssistant } from "@/components/ai/useFeezoAssistant";
import { useFeezoVoice } from "@/components/ai/useFeezoVoice";
import { cn, glassInsetClass } from "@/lib/utils";

type AssistantApi = ReturnType<typeof useFeezoAssistant>;

type Props = {
  assistant: AssistantApi;
};

const TIPS_EN = [
  "What is our current financial status?",
  "Show overdue fee students",
  "Open fees report",
  "Open Muhammed class 4 profile",
];

const TIPS_ML = [
  "ഇപ്പോഴത്തെ സാമ്പത്തിക സ്ഥിതി?",
  "കുടിശ്ശികയുള്ള വിദ്യാർത്ഥികൾ",
  "ഫീസ് റിപ്പോർട്ട് തുറക്കുക",
  "മുഹമ്മദ് ക്ലാസ് 4 പ്രൊഫൈൽ തുറക്കുക",
];

const FULLSCREEN_KEY = "feezo.ai.fullscreen.v1";

export function FeezoChatPanel({ assistant }: Props) {
  const {
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
  } = assistant;

  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => {
    try {
      return sessionStorage.getItem(FULLSCREEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const descId = useId();

  const voice = useFeezoVoice({
    locale,
    enabled: open,
    onWake: () => setOpen(true),
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setInterim("");
        setDraft((prev) => (prev ? `${prev} ${text}` : text));
      } else {
        setInterim(text);
      }
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(FULLSCREEN_KEY, fullscreen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [fullscreen]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, fullscreen]);

  if (!mounted || !open) return null;

  const tips = locale === "ml" ? TIPS_ML : TIPS_EN;
  const title = locale === "ml" ? "ഫീസോ AI" : "Feezo AI";
  const subtitle =
    locale === "ml"
      ? "ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ മൈക്ക് — “ഹേ ഫീസോ”"
      : "Type or mic — say “hey Feezo”";

  const iconBtn =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {!fullscreen ? (
        <button
          type="button"
          aria-label="Close Feezo"
          className="pointer-events-auto absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] dark:bg-black/50"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "pointer-events-auto absolute flex flex-col overflow-hidden border border-white/50 bg-gradient-to-b from-white/97 via-white/94 to-[#F0FDFA]/95 shadow-2xl shadow-teal-950/20 backdrop-blur-xl dark:border-white/10 dark:from-zinc-950/98 dark:via-zinc-950/95 dark:to-zinc-900/95",
          fullscreen
            ? "inset-0 h-dvh w-screen rounded-none border-0"
            : cn(
                "inset-x-3 bottom-[calc(60px+1rem+env(safe-area-inset-bottom,0px))] h-[min(78dvh,640px)] rounded-3xl",
                "md:inset-x-auto md:bottom-6 md:right-6 md:h-[min(72vh,680px)] md:w-[min(420px,calc(100vw-3rem))] md:rounded-[1.75rem]",
              ),
        )}
      >
        <header
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-b border-slate-100/80 px-3 py-3 dark:border-white/10 sm:gap-2 sm:px-4",
            fullscreen && "pt-[max(0.75rem,env(safe-area-inset-top))]",
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-base font-semibold text-slate-900 dark:text-zinc-50">
              {title}
            </h2>
            <p id={descId} className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              newChat();
              setDraft("");
              setInterim("");
              inputRef.current?.focus();
            }}
            disabled={busy}
            title={locale === "ml" ? "പുതിയ ചാറ്റ്" : "New chat"}
            aria-label={locale === "ml" ? "പുതിയ ചാറ്റ്" : "New chat"}
            className={iconBtn}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            title={
              fullscreen
                ? locale === "ml"
                  ? "ചെറുതാക്കുക"
                  : "Exit full screen"
                : locale === "ml"
                  ? "പൂർണ്ണ സ്ക്രീൻ"
                  : "Full screen"
            }
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            className={iconBtn}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 p-0.5 dark:border-white/10 dark:bg-zinc-900/70">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                locale === "en" ? "bg-[#0F766E] text-white" : "text-slate-500 dark:text-zinc-400",
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("ml")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                locale === "ml" ? "bg-[#0F766E] text-white" : "text-slate-500 dark:text-zinc-400",
              )}
            >
              ML
            </button>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className={iconBtn}>
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          ref={scrollerRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.length === 0 ? (
            <div className={cn("space-y-3 pt-1", fullscreen && "mx-auto w-full max-w-3xl")}>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                {locale === "ml"
                  ? "സ്കൂൾ ഡാറ്റയെക്കുറിച്ച് ചോദിക്കുക, നാവിഗേറ്റ് ചെയ്യുക, അല്ലെങ്കിൽ CRUD നിർദ്ദേശിക്കുക — സ്ഥിരീകരണത്തിന് ശേഷം മാത്രം സേവ് ചെയ്യും."
                  : "Ask about school data, navigate pages, or propose CRUD — saves only after you verify."}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tips.map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => void send(tip)}
                    className={cn(
                      glassInsetClass,
                      "rounded-full border border-white/70 px-3 py-1.5 text-left text-[11px] text-slate-700 dark:border-white/10 dark:text-zinc-200",
                    )}
                  >
                    {tip}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={cn("space-y-4", fullscreen && "mx-auto w-full max-w-3xl")}>
            {messages.map((m, i) => {
              const isLastAssistant =
                m.role === "assistant" && !messages.slice(i + 1).some((x) => x.role === "assistant");
              return (
              <div
                key={m.id}
                className={cn(
                  "group/msg flex max-w-[95%] flex-col",
                  fullscreen && "max-w-[min(95%,42rem)]",
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                )}
              >
                <div
                  className={cn(
                    "w-full rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-[#0F766E] text-white"
                      : cn(
                          glassInsetClass,
                          "border border-white/60 text-slate-800 dark:border-white/10 dark:text-zinc-100",
                        ),
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.role === "assistant" ? (
                    <>
                      <FeezoMessageRenderer
                        blocks={m.blocks}
                        navigations={m.navigations}
                        onNavigate={(nav) => {
                          applyNavigation(nav);
                          if (!fullscreen) setOpen(false);
                        }}
                      />
                      <div className="mt-2 space-y-2">
                        {(m.pendingActions ?? []).map((pa) => (
                          <FeezoConfirmCard
                            key={pa.id}
                            action={pa}
                            locale={locale}
                            confirming={confirmingId === pa.id}
                            onConfirm={() => void confirmAction(pa)}
                            onDismiss={() => dismissAction(pa.id)}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                {m.role === "assistant" ? (
                  <div className="mt-1.5 px-0.5">
                    <FeezoMessageActions
                      locale={locale}
                      messageId={m.id}
                      content={m.content}
                      blocks={m.blocks}
                      navigations={m.navigations}
                      model={m.model}
                      alwaysVisible={isLastAssistant}
                      onRegenerate={busy ? undefined : () => void regenerate(m.id)}
                    />
                  </div>
                ) : null}
              </div>
              );
            })}

            {busy ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0F766E]" />
                {locale === "ml" ? "ഫീസോ ചിന്തിക്കുന്നു…" : "Feezo is thinking…"}
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100/80 bg-white/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
          <div className={cn(fullscreen && "mx-auto w-full max-w-3xl")}>
            {interim ? (
              <div className="mb-1.5 text-[11px] italic text-slate-500 dark:text-zinc-400">{interim}</div>
            ) : null}
            {voice.error ? (
              <div className="mb-1.5 text-[11px] text-rose-600 dark:text-rose-400">{voice.error}</div>
            ) : null}
            <div className="flex items-end gap-2">
              <button
                type="button"
                disabled={!voice.supported}
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
                title={
                  voice.supported
                    ? locale === "ml"
                      ? "മൈക്ക് (ഹേ ഫീസോ)"
                      : "Mic (hey Feezo)"
                    : "Voice not supported"
                }
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border shadow-sm transition",
                  voice.listening
                    ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                    : "border-white/80 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300",
                  !voice.supported && "opacity-40",
                )}
              >
                {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const text = draft.trim();
                    if (!text) return;
                    setDraft("");
                    void send(text);
                  }
                }}
                placeholder="Type ..."
                className="max-h-28 min-h-[44px] flex-1 resize-none overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 outline-none ring-[#0F766E]/30 placeholder:text-slate-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              />
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => {
                  const text = draft.trim();
                  if (!text) return;
                  setDraft("");
                  void send(text);
                }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0F766E] text-white shadow-sm transition hover:bg-[#0d6a63] disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
