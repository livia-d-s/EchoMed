import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  Pause,
  Square,
  Activity,
  User
} from "lucide-react";

/* =======================
   CONSTANTES
======================= */

const AppStatus = {
  IDLE: "idle",
  RECORDING: "recording",
  PAUSED: "paused",
  PROCESSING: "processing",
};

/* =======================
   HELPERS
======================= */

const filterNameInput = (value: string) =>
  value.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s-]/g, "");

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
    .toString()
    .padStart(2, "0")}`;

/* =======================
   COMPONENT
======================= */

type Props = {
  onFinished: (result: any, consultation: any) => void;
};

export default function TranscriptionPage({ onFinished }: Props) {
  const [status, setStatus] = useState(AppStatus.IDLE);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const [showNameModal, setShowNameModal] = useState(false);
  const [tempPatientName, setTempPatientName] = useState("");

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* =======================
     SPEECH RECOGNITION
  ======================= */

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      if (finalText) {
        setCurrentTranscript((prev) => prev + " " + finalText);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interimText);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentTranscript, interimTranscript]);

  /* =======================
     CONTROLES
  ======================= */

  const startRecording = () => {
    try {
      recognitionRef.current?.start();
    } catch {}
    setStatus(AppStatus.RECORDING);
    timerRef.current = setInterval(
      () => setElapsedTime((p) => p + 1),
      1000
    );
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setStatus(AppStatus.PAUSED);
  };

  const handleFinish = async () => {
    stopRecording();
    setStatus(AppStatus.PROCESSING);
    setIsProcessing(true);

    try {
      const fullText = `${currentTranscript} ${interimTranscript}`.trim();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textPreview: fullText,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao analisar");
      }

      const result = await response.json();

      const consultation = {
        id: Date.now().toString(),
        patientName: patientName || "Paciente sem nome",
        date: new Date().toISOString(),
        transcript: result.formattedTranscript ?? fullText,
        result: result.diagnosisResult ?? result,
      };

      onFinished(consultation.result, consultation);
    } catch (err) {
      console.error(err);
      alert("Falha ao processar a análise.");
      setStatus(AppStatus.PAUSED);
      setIsProcessing(false);
    }
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="flex flex-col h-[75vh] relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border">
          <User className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={patientName}
            onChange={(e) =>
              setPatientName(filterNameInput(e.target.value))
            }
            placeholder="Nome do Paciente"
            className="bg-transparent outline-none font-semibold"
          />
        </div>

        {status === AppStatus.RECORDING && (
          <div className="flex items-center gap-3">
            <span className="font-mono bg-white px-3 py-1 rounded-full border">
              {formatTime(elapsedTime)}
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Gravando
            </div>
          </div>
        )}
      </div>

      {/* TRANSCRIÇÃO */}
      <div className="flex-1 bg-white rounded-3xl border overflow-hidden relative">
        <div ref={scrollRef} className="h-full overflow-y-auto p-8">
          {currentTranscript === "" &&
          interimTranscript === "" &&
          status === AppStatus.IDLE ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Mic size={64} className="mb-4 opacity-20" />
              <p>Clique no microfone para iniciar</p>
            </div>
          ) : (
            <div className="text-xl leading-relaxed">
              <span>{currentTranscript}</span>
              <span className="text-slate-400">
                {" "}
                {interimTranscript}
              </span>
            </div>
          )}
        </div>

        {/* CONTROLES */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
          {(status === AppStatus.IDLE ||
            status === AppStatus.PAUSED) && (
            <button
              onClick={() =>
                patientName.trim()
                  ? startRecording()
                  : setShowNameModal(true)
              }
              className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center"
            >
              <Mic size={28} />
            </button>
          )}

          {status === AppStatus.RECORDING && (
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-white border rounded-full flex items-center justify-center"
            >
              <Pause size={28} />
            </button>
          )}

          {status !== AppStatus.IDLE && (
            <button
              onClick={handleFinish}
              disabled={isProcessing}
              className="h-14 px-8 bg-slate-900 text-white rounded-full font-bold flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Activity className="animate-spin" /> Analisando…
                </>
              ) : (
                <>
                  <Square size={18} /> Finalizar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODAL NOME */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h2 className="font-bold mb-4 text-center">
              Nome do paciente
            </h2>
            <input
              autoFocus
              value={tempPatientName}
              onChange={(e) =>
                setTempPatientName(
                  filterNameInput(e.target.value)
                )
              }
              className="w-full border px-4 py-3 rounded mb-4 text-center"
            />
            <button
              onClick={() => {
                setPatientName(tempPatientName);
                setShowNameModal(false);
                startRecording();
              }}
              disabled={!tempPatientName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded font-bold"
            >
              Iniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
