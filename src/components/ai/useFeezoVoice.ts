import { useCallback, useEffect, useRef, useState } from "react";

type SpeechAlt = { transcript?: string; confidence?: number };

type SpeechResult = {
  isFinal: boolean;
  length?: number;
  [index: number]: SpeechAlt | undefined;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
};

export type FeezoVoiceLocale = "en" | "ml";

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Indian English for EN, Malayalam (India) for ML. */
export function voiceRecognitionLang(locale: FeezoVoiceLocale): string {
  return locale === "ml" ? "ml-IN" : "en-IN";
}

const WAKE_PATTERNS = [
  /^(hey|hai|hi)\s+feezo\b/i,
  /^ഹേയ്?\s*ഫീസോ/,
  /^ഹായ്?\s*ഫീസോ/,
  /^ഫീസോ\b/,
];

function bestTranscript(result: SpeechResult): string {
  const count = result.length && result.length > 0 ? result.length : 1;
  let text = "";
  let confidence = -1;
  for (let index = 0; index < count; index += 1) {
    const alt = result[index];
    const transcript = alt?.transcript?.trim() ?? "";
    if (!transcript) continue;
    const score = typeof alt?.confidence === "number" ? alt.confidence : 0;
    if (confidence < 0 || score > confidence) {
      text = transcript;
      confidence = score;
    }
  }
  return text;
}

/**
 * Light cleanup after the browser's guess.
 * Only fixes endings that are reliably wrong in school questions ("explain peace").
 */
function polishTranscript(raw: string, locale: FeezoVoiceLocale): string {
  let text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (locale === "ml") {
    text = text
      .replace(/^(ഹേയ്?|ഹായ്?)\s*ഫീസോ[,.!]?\s*/u, "")
      .replace(/^ഫീസോ[,.!]?\s*/u, "")
      .trim();
    return text;
  }
  text = text.replace(/^(hey|hai|hi)\s+feezo[,.!]?\s*/i, "").trim();
  // School questions end in "please"; Chrome often hears peace / piece / pleas.
  text = text.replace(/\b(?:peace|piece|pleas)([.?!])?$/i, "please$1");
  return text;
}

function voiceErrorMessage(code: string, locale: FeezoVoiceLocale): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return locale === "ml"
      ? "മൈക്രോഫോൺ അനുവാദം തടഞ്ഞിരിക്കുന്നു. ബ്രൗസർ ക്രമീകരണത്തിൽ മൈക്ക് അനുവദിച്ച് വീണ്ടും ശ്രമിക്കുക."
      : "Microphone permission is blocked. Allow the mic for this site, then try again.";
  }
  if (code === "language-not-supported") {
    return locale === "ml"
      ? "ഈ ബ്രൗസറിൽ മലയാളം വോയ്സ് ലഭ്യമല്ല. Chrome ഉപയോഗിക്കുക, അല്ലെങ്കിൽ English തിരഞ്ഞെടുക്കുക."
      : "English voice isn't available in this browser.";
  }
  if (code === "network") {
    return locale === "ml"
      ? "വോയ്സിന് നെറ്റ്‌വർക്ക് വേണം. കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക."
      : "Voice needs a network connection. Check it and try again.";
  }
  if (code === "audio-capture") {
    return locale === "ml"
      ? "മൈക്രോഫോൺ കണ്ടെത്താനായില്ല."
      : "No microphone was found.";
  }
  return locale === "ml" ? "വോയ്സ് തിരിച്ചറിയൽ നിർത്തി. വീണ്ടും ശ്രമിക്കുക." : "Voice recognition stopped. Try again.";
}

export function useFeezoVoice(opts: {
  locale: FeezoVoiceLocale;
  enabled: boolean;
  getDraft: () => string;
  onDraft: (text: string) => void;
  onInterim: (text: string) => void;
  onWake: () => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const wantRef = useRef(false);
  const anchorRef = useRef("");
  const composedRef = useRef("");
  const interimRef = useRef("");
  const restartTimer = useRef<number | null>(null);
  const restartsRef = useRef(0);
  const quietRef = useRef(false);
  const startedAtRef = useRef(0);
  const localeRef = useRef(opts.locale);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const clearRestart = useCallback(() => {
    if (restartTimer.current != null) {
      window.clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
  }, []);

  const halt = useCallback(() => {
    clearRestart();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try {
      rec?.abort();
    } catch {
      try {
        rec?.stop();
      } catch {
        // already stopped
      }
    }
  }, [clearRestart]);

  const publish = useCallback((results: ArrayLike<SpeechResult>) => {
    let committed = "";
    let interim = "";
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      if (!result) continue;
      const text = bestTranscript(result);
      if (!text) continue;
      if (result.isFinal) committed = `${committed} ${text}`.trim();
      else interim = `${interim} ${text}`.trim();
    }
    const locale = optsRef.current.locale;
    const polished = polishTranscript(committed, locale);
    const live = polishTranscript(interim, locale);
    interimRef.current = live;
    const heard = `${polished} ${live}`.trim();
    if (WAKE_PATTERNS.some((pattern) => pattern.test(heard))) {
      optsRef.current.onWake();
    }
    const anchor = anchorRef.current.trim();
    const nextDraft = [anchor, polished].filter(Boolean).join(" ");
    if (nextDraft !== composedRef.current) {
      composedRef.current = nextDraft;
      optsRef.current.onDraft(nextDraft);
    }
    optsRef.current.onInterim(live);
  }, []);

  const begin = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || !wantRef.current) return;
    halt();
    setError(null);

    const rec = new Ctor();
    const locale = optsRef.current.locale;
    rec.lang = voiceRecognitionLang(locale);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onresult = (event) => {
      if (recognitionRef.current !== rec) return;
      restartsRef.current = 0;
      publish(event.results);
    };

    rec.onerror = (event) => {
      const code = event.error ?? "";
      if (code === "no-speech") {
        quietRef.current = true;
        return;
      }
      if (code === "aborted") return;
      wantRef.current = false;
      setListening(false);
      recognitionRef.current = null;
      optsRef.current.onInterim("");
      setError(voiceErrorMessage(code, optsRef.current.locale));
    };

    rec.onend = () => {
      if (recognitionRef.current !== rec) return;
      recognitionRef.current = null;
      if (!wantRef.current) {
        setListening(false);
        return;
      }
      // Chrome drops the session on a pause. Keep accepted words, then listen again.
      anchorRef.current = composedRef.current.trim();
      interimRef.current = "";
      optsRef.current.onInterim("");
      const lived = Date.now() - startedAtRef.current;
      const quiet = quietRef.current;
      quietRef.current = false;
      if (!quiet && lived < 500) restartsRef.current += 1;
      else restartsRef.current = 0;
      if (restartsRef.current >= 4) {
        wantRef.current = false;
        setListening(false);
        setError(voiceErrorMessage("", optsRef.current.locale));
        return;
      }
      clearRestart();
      restartTimer.current = window.setTimeout(() => {
        restartTimer.current = null;
        if (wantRef.current) begin();
      }, 280);
    };

    try {
      recognitionRef.current = rec;
      rec.start();
      startedAtRef.current = Date.now();
      setListening(true);
    } catch (err) {
      recognitionRef.current = null;
      const message = err instanceof Error ? err.message : "";
      if (/already started/i.test(message)) {
        setListening(true);
        return;
      }
      wantRef.current = false;
      setListening(false);
      setError(
        optsRef.current.locale === "ml"
          ? "മൈക്രോഫോൺ തുറക്കാനായില്ല."
          : "Could not start the microphone.",
      );
    }
  }, [clearRestart, halt, publish]);

  const start = useCallback(() => {
    if (!getSpeechRecognitionCtor()) {
      setError(
        optsRef.current.locale === "ml"
          ? "ഈ ബ്രൗസറിൽ വോയ്സ് ലഭ്യമല്ല. Chrome ഉപയോഗിക്കുക."
          : "Voice input is not supported in this browser. Use Chrome.",
      );
      return;
    }
    anchorRef.current = optsRef.current.getDraft().trim();
    composedRef.current = anchorRef.current;
    restartsRef.current = 0;
    wantRef.current = true;
    begin();
  }, [begin]);

  const stop = useCallback((flush = true) => {
    wantRef.current = false;
    const pending = interimRef.current.trim();
    halt();
    setListening(false);
    if (flush && pending) {
      const next = [composedRef.current.trim(), pending].filter(Boolean).join(" ");
      composedRef.current = next;
      optsRef.current.onDraft(next);
    }
    interimRef.current = "";
    optsRef.current.onInterim("");
  }, [halt]);

  useEffect(() => {
    const previous = localeRef.current;
    localeRef.current = opts.locale;
    if (previous === opts.locale || !wantRef.current) return;
    const pending = interimRef.current.trim();
    const anchor = [composedRef.current.trim(), pending].filter(Boolean).join(" ");
    anchorRef.current = anchor;
    composedRef.current = anchor;
    interimRef.current = "";
    if (pending) optsRef.current.onDraft(anchor);
    optsRef.current.onInterim("");
    restartsRef.current = 0;
    begin();
  }, [begin, opts.locale]);

  useEffect(() => {
    if (!opts.enabled && wantRef.current) stop();
  }, [opts.enabled, stop]);

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, error, start, stop };
}
