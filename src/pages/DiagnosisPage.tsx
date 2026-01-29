import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { StethoscopeIcon, ActivityIcon, TestTubeIcon, PillIcon, ChevronRightIcon } from '../components/Icons';

const DiagnosisPage: React.FC = () => {
  const { currentResult, selectedConsultationId, history, resetSession } = useAppContext();
  const navigate = useNavigate();

  // If no result is loaded in state, try to find it from history or redirect
  const result = currentResult || (selectedConsultationId ? history.find(h => h.id === selectedConsultationId)?.result : null);

  useEffect(() => {
    if (!result) {
      navigate('/');
    }
  }, [result, navigate]);

  const handleNewConsultation = () => {
    resetSession();
    navigate('/');
  };

  if (!result) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
        <div>
           <p className="text-slate-500 font-medium mb-1">Resultado da Análise IA</p>
           <h1 className="text-3xl font-bold text-slate-900">
             {result.nutritionalAssessment ? 'Avaliação Nutricional' : 'Avaliação Clínica'}
           </h1>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <button 
              onClick={handleNewConsultation} 
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
           >
              Nova Consulta
           </button>
           <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
              Salvar Relatório
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Diagnosis Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <StethoscopeIcon className="w-32 h-32 text-blue-500" />
           </div>
           
           <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                  <StethoscopeIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                 <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                   {result.nutritionalAssessment ? 'Avaliação Nutricional' : 'Diagnóstico Principal'}
                 </h2>
                 <p className="text-2xl font-bold text-slate-900 mb-2">
                   {result.nutritionalAssessment || result.diagnosis}
                 </p>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Racional Clínico</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">
                        {result.clinicalRationale || result.rationale}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Possible Diseases / Conditions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                  <ActivityIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">
                  {result.possibleAssociatedConditions ? 'Condições Associadas' : 'Diagnóstico Diferencial'}
                </h3>
            </div>
            <ul className="space-y-3 flex-1">
                {(result.possibleAssociatedConditions || result.possibleDiseases || []).map((disease, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                        </div>
                        <span className="text-slate-700 font-medium">{disease}</span>
                    </li>
                ))}
            </ul>
        </div>

        {/* Exams */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 border border-purple-100">
                  <TestTubeIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">
                  {result.recommendedExams ? 'Exames Recomendados' : 'Exames Sugeridos'}
                </h3>
            </div>
             <ul className="space-y-3 flex-1">
                {(result.recommendedExams || result.exams || []).map((exam, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="bg-purple-100 text-purple-600 rounded p-1">
                           <TestTubeIcon className="w-3 h-3" />
                        </div>
                        <span className="text-slate-700 font-medium">{exam}</span>
                    </li>
                ))}
            </ul>
        </div>

        {/* Nutritional Conduct / Treatment */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500 border border-teal-100">
                  <PillIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">
                  {result.nutritionalConduct ? 'Conduta Nutricional' : 'Tratamento Recomendado'}
                </h3>
            </div>
            {result.nutritionalConduct ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {result.nutritionalConduct}
                </p>
              </div>
            ) : result.medications ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.medications.map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all cursor-default group">
                          <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                               <span className="font-semibold text-slate-700">{med}</span>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                  ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">Nenhuma conduta especificada</p>
            )}
        </div>

      </div>
    </div>
  );
};

export default DiagnosisPage;