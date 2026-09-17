import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
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
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const WAKE_PATTERNS = [
  /hey\s*feezo/i,
  /hai\s*feezo/i,
  /ഹേ\s*ഫീസോ/,
  /ഹായ്\s*ഫീസോ/,
  /ഫീസോ/,
];

export function useFeezoVoice(opts: {
  locale: "en" | "ml";
  enabled: boolean;
  onWake: () => void;
  onTranscript: (text: string, isFinal: boolean) => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try {
      rec?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser");
      return;
    }
    stop();
    setError(null);

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = optsRef.current.locale === "ml" ? "ml-IN" : "en-IN";

    rec.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interim += transcript;
      }

      const combined = `${finalText} ${interim}`.trim();
      if (WAKE_PATTERNS.some((re) => re.test(combined))) {
        optsRef.current.onWake();
      }

      if (finalText.trim()) {
        const cleaned = finalText
          .replace(/hey\s*feezo[,!.]?\s*/gi, "")
          .replace(/hai\s*feezo[,!.]?\s*/gi, "")
          .trim();
        if (cleaned) optsRef.current.onTranscript(cleaned, true);
      } else if (interim.trim()) {
        optsRef.current.onTranscript(interim.trim(), false);
      }
    };

    rec.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setError(event.error ?? "Speech recognition error");
      setListening(false);
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) {
        setListening(false);
        recognitionRef.current = null;
      }
    };

    try {
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start microphone");
      setListening(false);
    }
  }, [stop]);

  useEffect(() => {
    if (!opts.enabled && listening) stop();
  }, [opts.enabled, listening, stop]);

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, error, start, stop };
}
