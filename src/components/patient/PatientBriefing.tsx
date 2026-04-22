import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Calendar, MessageCircleQuestion, Sliders } from 'lucide-react';
import { TimelineEvent } from '../../../types';

interface PatientBriefingProps {
  events: TimelineEvent[];
}

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

const toTime = (d: any): number => {
  if (!d) return 0;
  if (d.toDate) return d.toDate().getTime();
  if (d.seconds) return d.seconds * 1000;
  const parsed = new Date(d).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export function PatientBriefing({ events }: PatientBriefingProps) {
  const [expanded, setExpanded] = useState(true);

  // Find last consultation (not adjustment)
  const consultations = events
    .filter(e => e.type !== 'adjustment')
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  // Don't show briefing if no prior consultation
  if (consultations.length === 0) return null;

  const lastConsultation = consultations[0];
  const result: any = lastConsultation.result || {};
  const summary: string = result.nutritionalAssessment || result.diagnosis || '';
  const questions: string[] = Array.isArray(result.suggestedNextQuestions)
    ? result.suggestedNextQuestions.slice(0, 3)
    : [];

  // Observations (adjustments) linked to the last consultation
  const linkedAdjustments = events
    .filter(e => e.type === 'adjustment' && e.parentEventId === lastConsultation.id)
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  const hasAnyContent = summary || questions.length > 0 || linkedAdjustments.length > 0;
  if (!hasAnyContent) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl md:rounded-3xl overflow-hidden mb-4 md:mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-blue-100/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-black text-sm md:text-base text-slate-900">
              Briefing para próxima consulta
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar size={11} />
              Baseado na consulta de {formatDate(lastConsultation.date)}
            </p>
          </div>
        </div>
        <div className="text-slate-400 flex-shrink-0 ml-2">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-4">
          {/* Summary */}
          {summary && (
            <div className="bg-white/60 border border-blue-100 rounded-xl p-3 md:p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">
                Resumo da última consulta
              </div>
              <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{summary}</p>
            </div>
          )}

          {/* Pending observations */}
          {linkedAdjustments.length > 0 && (
            <div className="bg-white/60 border border-amber-100 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sliders size={12} className="text-amber-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  Observações desta consulta
                </span>
              </div>
              <ul className="space-y-1.5">
                {linkedAdjustments.map((adj) => (
                  <li key={adj.id} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                    <span className="text-amber-500 mt-1 flex-shrink-0">•</span>
                    <span>{adj.adjustmentNote}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested questions */}
          {questions.length > 0 && (
            <div className="bg-white/60 border border-indigo-100 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageCircleQuestion size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  Perguntas sugeridas pela IA
                </span>
              </div>
              <ul className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black mt-0.5">
                      {i + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
