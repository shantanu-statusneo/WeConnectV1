"use client";

import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type IntakeSectionProps = {
  show: boolean;
  query: string;
  setQuery: (v: string) => void;
  onDiscover: () => void;
  sessionId: string | null;
};

function createSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function IntakeSection({ show, query, setQuery, onDiscover, sessionId }: IntakeSectionProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try { recognition.stop(); } catch { /* noop */ }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const listenForBusinessName = useCallback(() => {
    if (listening) {
      stopListening();
      return;
    }
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setVoiceSupported(false);
      return;
    }

    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        parts.push(event.results[i]?.[0]?.transcript ?? "");
      }
      const transcript = parts
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (transcript) setQuery(transcript);
    };
    recognition.onerror = () => {
      stopListening();
      setVoiceSupported(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    setVoiceSupported(true);
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }, [listening, setQuery, stopListening]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  if (!show) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-[0_14px_36px_rgb(15,23,42,0.1)] backdrop-blur-xl sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">Step 1: Supplier Registration</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter the supplier name, business name, or URL. We will call the Google-powered discovery service and prefill organisation details for review.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white/85 transition focus-within:border-cyan-300/80 focus-within:ring-2 focus-within:ring-cyan-200/40">
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type or Speak supplier name, business name, or URL"
          />
          <button
            type="button"
            onClick={listenForBusinessName}
            className={`flex h-10 w-10 shrink-0 items-center justify-center border-l border-slate-200 transition-colors ${
              listening ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
            }`}
            title={listening ? "Stop listening" : "Speak business name"}
            aria-label={listening ? "Stop listening" : "Speak business name"}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
        <button
          type="button"
          onClick={onDiscover}
          disabled={!sessionId}
          className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgb(8,112,184,0.35)] transition hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40"
        >
          Fetch Details
        </button>
      </div>
      {!voiceSupported && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          Voice input is not available in this browser. You can still type the business name.
        </p>
      )}
    </section>
  );
}
