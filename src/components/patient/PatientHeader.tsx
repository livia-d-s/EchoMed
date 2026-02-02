import React, { useState } from 'react';
import { ArrowLeft, Plus, Sliders, Pencil, Check, X, Target, Dumbbell } from 'lucide-react';
import { Patient, GOAL_LABELS } from '../../../types';

interface PatientHeaderProps {
  patient: Patient;
  onBack: () => void;
  onNewConsultation: () => void;
  onNewAdjustment: () => void;
  onEditPatient?: (patientId: string, newName: string) => void;
}

export function PatientHeader({
  patient,
  onBack,
  onNewConsultation,
  onNewAdjustment,
  onEditPatient
}: PatientHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(patient.name);
  const initial = patient.name.charAt(0).toUpperCase();

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== patient.name) {
      onEditPatient?.(patient.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(patient.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-6
                    sticky top-[73px] z-30 backdrop-blur-sm bg-white/95">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-4
                     hover:gap-3 transition-all"
        >
          <ArrowLeft size={16} />
          Voltar para pacientes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600
                            flex items-center justify-center text-white text-2xl font-black
                            shadow-lg shadow-blue-200 flex-shrink-0">
              {initial}
            </div>
            <div className="group">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-2xl font-black text-slate-900 leading-tight bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Salvar"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">
                    {patient.name}
                  </h1>
                  {onEditPatient && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar nome"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
              <p className="text-slate-500 text-sm mt-0.5">
                Paciente desde {formatDate(patient.createdAt)}
              </p>
              {/* Goal and Training Display */}
              {(patient.goals?.length || patient.goal || patient.trainingRoutine?.length) && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {(patient.goals?.length || patient.goal) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Target size={10} />
                      {patient.goals?.length
                        ? patient.goals.map(g => g === 'outro' ? patient.goalCustom : GOAL_LABELS[g]).join(' + ')
                        : (patient.goal === 'outro' ? patient.goalCustom : GOAL_LABELS[patient.goal!])
                      }
                    </span>
                  )}
                  {patient.trainingRoutine?.length ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Dumbbell size={10} />
                      {patient.trainingRoutine.map(t => `${t.type}: ${t.frequency}`).join(', ')}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onNewConsultation}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white
                         rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors
                         shadow-lg shadow-blue-200"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova Consulta</span>
              <span className="sm:hidden">Consulta</span>
            </button>
            <button
              onClick={onNewAdjustment}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200
                         text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50
                         transition-colors"
            >
              <Sliders size={16} />
              <span className="hidden sm:inline">Ajuste de Plano</span>
              <span className="sm:hidden">Ajuste</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
