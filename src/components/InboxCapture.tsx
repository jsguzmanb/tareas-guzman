"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createInboxTask } from "@/lib/actions";

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export default function InboxCapture({
  projectId,
  placeholder,
}: {
  projectId?: string;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [title, setTitle] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const speechWindow = window as SpeechRecognitionWindow;
    setIsVoiceSupported(
      Boolean(
        speechWindow.SpeechRecognition ??
          speechWindow.webkitSpeechRecognition,
      ),
    );

    return () => recognitionRef.current?.stop();
  }, []);

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsVoiceSupported(false);
      setVoiceError("El reconocimiento de voz no está disponible en este navegador.");
      return;
    }

    setVoiceError(null);
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript.trim();
      if (!transcript) return;

      setTitle((currentTitle) =>
        [currentTitle.trim(), transcript].filter(Boolean).join(" "),
      );
    };
    recognition.onerror = () => {
      setVoiceError(
        "No pude escuchar el audio. Revisa el permiso del micrófono e inténtalo de nuevo.",
      );
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }

  return (
    <div>
      <form
        ref={formRef}
        action={(formData: FormData) => {
          startTransition(async () => {
            await createInboxTask(formData);
            setTitle("");
            formRef.current?.reset();
          });
        }}
        className="flex gap-2"
      >
        {projectId && <input type="hidden" name="projectId" value={projectId} />}
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={placeholder ?? "¿Qué tienes en la cabeza? Escríbelo y ya."}
          autoFocus
          className="min-w-0 flex-1 border border-neutral-300 rounded-lg px-3 py-2 bg-white"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={toggleListening}
          disabled={isPending || !isVoiceSupported}
          aria-label={isListening ? "Detener dictado" : "Agregar tarea por voz"}
          aria-pressed={isListening}
          title={
            isVoiceSupported
              ? isListening
                ? "Detener dictado"
                : "Agregar tarea por voz"
              : "Tu navegador no admite reconocimiento de voz"
          }
          className={`border px-3 py-2 rounded-lg font-medium disabled:opacity-50 ${
            isListening
              ? "border-red-500 bg-red-50 text-red-700"
              : "border-neutral-300 bg-white text-neutral-900"
          }`}
        >
          {isListening ? "Escuchando…" : "🎤"}
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          Capturar
        </button>
      </form>
      {voiceError && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {voiceError}
        </p>
      )}
    </div>
  );
}
