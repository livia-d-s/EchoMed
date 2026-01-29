import React, { useState } from 'react';
import { Sliders, X } from 'lucide-react';

interface AdjustmentModalProps {
  patientName: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export function AdjustmentModal({ patientName, onSave, onClose }: AdjustmentModalProps) {
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!note.trim()) return;
    onSave(note.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl
                      animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sliders size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Ajuste de Plano</h3>
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
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Descrição do Ajuste
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
            Descreva as alterações realizadas no plano nutricional do paciente.
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
            Salvar Ajuste
          </button>
        </div>
      </div>
    </div>
  );
}
