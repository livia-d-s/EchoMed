import React, { useState } from 'react';
import { Sliders, X, ChevronDown } from 'lucide-react';
import { TimelineEvent } from '../../../types';

interface AdjustmentModalProps {
  patientName: string;
  consultations: TimelineEvent[];
  onSave: (note: string, parentEventId?: string) => void;
  onClose: () => void;
}

const formatDate = (d: any) => {
  try {
    if (!d) return '';
    let date: Date;
    if (d.toDate) date = d.toDate();
    else if (d.seconds) date = new Date(d.seconds * 1000);
    else date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

export function AdjustmentModal({ patientName, consultations, onSave, onClose }: AdjustmentModalProps) {
  const [note, setNote] = useState('');
  const [selectedConsultationId, setSelectedConsultationId] = useState(
    consultations.length > 0 ? consultations[0].id : ''
  );

  const handleSave = () => {
    if (!note.trim()) return;
    onSave(note.trim(), selectedConsultationId || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl
                      animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sliders size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Observação</h3>
              <p className="text-slate-500 text-sm">{patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Consultation selector */}
          {consultations.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Consulta referente
              </label>
              <div className="relative">
                <select
                  value={selectedConsultationId}
                  onChange={(e) => setSelectedConsultationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pr-10
                             outline-none font-medium focus:ring-2 focus:ring-amber-100
                             focus:border-amber-300 transition-all appearance-none cursor-pointer"
                >
                  {consultations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.type === 'initial' ? 'Consulta inicial' : 'Retorno'} — {formatDate(c.date)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Descrição da Observação
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Aumentar proteína de 1.2g para 1.5g/kg devido à boa adesão e resultados positivos..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4
                         outline-none font-medium focus:ring-2 focus:ring-amber-100
                         focus:border-amber-300 transition-all resize-none"
              autoFocus
            />
          </div>

          <p className="text-xs text-slate-400">
            Descreva as alterações ou observações sobre esta consulta do paciente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100
                       hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim()}
            className="flex-1 py-4 rounded-xl font-bold text-white bg-amber-500
                       hover:bg-amber-600 transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed"
          >
            Salvar Observação
          </button>
        </div>
      </div>
    </div>
  );
}
