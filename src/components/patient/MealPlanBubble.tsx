import React, { useState } from 'react';
import { Utensils, X, Loader2, Sparkles, Save } from 'lucide-react';
import { Patient, StructuredMealPlan } from '../../../types';

interface MealPlanBubbleProps {
  patient: Patient;
  // Optional initial plan (e.g., when shown on the DiagnosisView with an existing plan)
  initialPlan?: StructuredMealPlan | null;
  // Updates the patient's anthropometric/restriction data
  onUpdatePatient: (changes: Partial<Patient>) => void;
  // Called when nutri clicks "Gerar plano"
  onGeneratePlan: (anthropometry: {
    weightKg?: number;
    heightCm?: number;
    age?: number;
    dietaryRestrictions?: string;
  }) => Promise<StructuredMealPlan | null>;
}

export function MealPlanBubble({
  patient,
  initialPlan,
  onUpdatePatient,
  onGeneratePlan,
}: MealPlanBubbleProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<boolean>(!!initialPlan);

  // Local edit state for anthropometric data (initialized from patient)
  const [weight, setWeight] = useState<string>(patient.weightKg ? String(patient.weightKg) : '');
  const [height, setHeight] = useState<string>(patient.heightCm ? String(patient.heightCm) : '');
  const [birthDate, setBirthDate] = useState<string>(patient.birthDate || '');
  const [restrictions, setRestrictions] = useState<string>(patient.dietaryRestrictions || '');

  const computeAge = (iso: string): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const ms = Date.now() - d.getTime();
    const yrs = Math.floor(ms / (365.25 * 24 * 3600 * 1000));
    return yrs > 0 && yrs < 130 ? yrs : null;
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      // Persist any data changes back to patient first
      const w = parseFloat(weight.replace(',', '.'));
      const h = parseFloat(height.replace(',', '.'));
      const changes: Partial<Patient> = {};
      if (!isNaN(w) && w > 0) changes.weightKg = w;
      if (!isNaN(h) && h > 0) changes.heightCm = h;
      if (birthDate) changes.birthDate = birthDate;
      if (restrictions.trim()) changes.dietaryRestrictions = restrictions.trim();
      if (Object.keys(changes).length > 0) onUpdatePatient(changes);

      const anthropo: any = {};
      if (!isNaN(w) && w > 0) anthropo.weightKg = w;
      if (!isNaN(h) && h > 0) anthropo.heightCm = h;
      const age = computeAge(birthDate);
      if (age) anthropo.age = age;
      if (restrictions.trim()) anthropo.dietaryRestrictions = restrictions.trim();

      const plan = await onGeneratePlan(anthropo);
      if (plan) {
        setGenerated(true);
        setOpen(false);
      } else {
        setError('A IA não retornou um plano estruturado. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Plan generation error:', err);
      setError(err?.message || 'Erro ao gerar plano alimentar.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Panel (expanded) */}
      {open && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between">
              <div className="text-white min-w-0">
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  <Utensils size={14} /> Plano Alimentar
                </h3>
                <p className="text-[10px] text-emerald-100 mt-0.5">
                  Dados clínicos e geração baseada na consulta
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

            {/* Body */}
            <div className="p-4 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Dados clínicos <span className="font-normal normal-case">(opcionais — melhoram a sugestão)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Peso (kg)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 outline-none text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Altura (cm)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 outline-none text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 outline-none text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  title="Data de nascimento"
                />
              </div>
              <input
                type="text"
                placeholder="Restrições / preferências (ex: vegetariana, sem lactose)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 outline-none text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all mt-2"
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
              />

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles size={10} className="text-emerald-600" /> A IA também usa
                </div>
                <ul className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
                  <li>• Tudo o que foi dito na consulta</li>
                  <li>• Objetivo e rotina de treino do paciente</li>
                  <li>• Adesão e perfil comportamental detectados</li>
                  <li>• Exames anexados (se houver)</li>
                </ul>
              </div>

              {error && (
                <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-60"
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" /> Gerando plano…</>
                ) : generated ? (
                  <><Save size={14} /> Gerar plano novamente</>
                ) : (
                  <><Sparkles size={14} /> Gerar plano alimentar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 md:right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center group"
        title="Plano alimentar — dados clínicos e geração"
        style={{ right: 'calc(1rem + 60px)' }}
      >
        <Utensils size={18} />
        {generated && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </button>
    </>
  );
}
