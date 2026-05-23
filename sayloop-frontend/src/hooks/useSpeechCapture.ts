import { useEffect, useRef } from 'react';
import { appendTranscriptLine } from '@/lib/sessionTranscript';

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Captures the local speaker's words during a live debate (Chrome / Edge).
 * Runs alongside WebRTC mic — starts early (joining room) so text is ready for review.
 */
export function useSpeechCapture(enabled: boolean, sessionId: string | null) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const sessionIdRef = useRef(sessionId);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const boundSessionId = String(sessionId);
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      console.warn('[speech] Web Speech API not supported — use Chrome or Edge for coaching');
      return;
    }

    let stopped = false;

    const scheduleRestart = (ms = 400) => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        if (!stopped && enabledRef.current && sessionIdRef.current === boundSessionId) {
          tryStart();
        }
      }, ms);
    };

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const sid = sessionIdRef.current;
      if (!sid || String(sid) !== boundSessionId) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim();
        if (!text) continue;
        if (result.isFinal) {
          appendTranscriptLine(boundSessionId, text);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('[speech]', event.error);
      if (event.error === 'audio-capture' || event.error === 'not-allowed') {
        scheduleRestart(1200);
      }
    };

    recognition.onend = () => {
      if (!stopped && enabledRef.current && sessionIdRef.current === boundSessionId) {
        scheduleRestart(300);
      }
    };

    const tryStart = () => {
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        scheduleRestart(800);
      }
    };

    const startDelay = setTimeout(tryStart, 600);

    return () => {
      stopped = true;
      clearTimeout(startDelay);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognition.onend = null;
      recognition.onresult = null;
      setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          try {
            recognition.abort();
          } catch {
            /* ignore */
          }
        }
        recognitionRef.current = null;
      }, 400);
    };
  }, [enabled, sessionId]);
}
