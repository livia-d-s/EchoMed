import React, { useState } from 'react';
import { Sparkles, X, Calendar } from 'lucide-react';
import { TimelineEvent } from '../../../types';

interface ConsultationBriefingBubbleProps {
  events: TimelineEvent[];
  patientName: string;
  patients: any[];
}

const toTime = (d: any): number => {
  if (!d) return 0;
  if (d.toDate) return d.toDate().getTime();
  if (d.seconds) return d.seconds * 1000;
  const parsed = new Date(d).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const formatDate = (d: any) => {
  try {
    if (!d) return '';
    let date: Date;
    if (d.toDate) date = d.toDate();
    else if (d.seconds) date = new Date(d.seconds * 1000);
    else date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

export function ConsultationBriefingBubble({
  events,
  patientName,
  patients,
}: ConsultationBriefingBubbleProps) {
  const [open, setOpen] = useState(false);

  // Find the patient by name
  const pn = (patientName || '').trim().toLowerCase();
  if (!pn) return null;
  const patient = patients.find((p: any) => p.name?.toLowerCase() === pn);
  if (!patient) return null;

  // Find their most recent consultation (not adjustment) with suggestions
  const consultations = events
    .filter(e => e.patientId === patient.id && e.type !== 'adjustment')
    .sort((a, b) => toTime(b.date) - toTime(a.date));
  if (consultations.length === 0) return null;

  const lastConsultation = consultations[0];
  const result: any = lastConsultation.result || {};
  const suggestions: string[] = Array.isArray(result.suggestedNextQuestions)
    ? result.suggestedNextQuestions.slice(0, 3)
    : [];
  if (suggestions.length === 0) return null;

  return (
    <>
      {/* Panel (expanded) */}
      {open && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="text-white min-w-0">
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  <Sparkles size={14} /> Sugestões para essa consulta
                </h3>
                <p className="text-[10px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <Calendar size={10} /> Baseado na consulta de {formatDate(lastConsultation.date)}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <ul className="space-y-3">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black mt-0.5">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 md:right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center group"
        title={`${suggestions.length} sugestão${suggestions.length > 1 ? 'ões' : ''} para essa consulta`}
      >
        <Sparkles size={18} />
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center">
          {suggestions.length}
        </span>
      </button>
    </>
  );
}
