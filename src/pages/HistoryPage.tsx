import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChevronRightIcon, FileTextIcon, HistoryIcon, SearchIcon, UserIcon } from '../components/Icons';

const HistoryPage: React.FC = () => {
  const { history, setSelectedConsultationId, resetSession } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const handleSelect = (id: string) => {
    setSelectedConsultationId(id);
    navigate('/diagnosis');
  };

  const handleNew = () => {
    resetSession();
    navigate('/');
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    }).format(date);
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // Filter by Text (Patient Name or Diagnosis)
      const lowerTerm = searchTerm.toLowerCase();
      const matchesText = !searchTerm || 
        (item.patientName && item.patientName.toLowerCase().includes(lowerTerm)) ||
        (item.result?.diagnosis && item.result.diagnosis.toLowerCase().includes(lowerTerm));

      // Filter by Date (if selected)
      let matchesDate = true;
      if (searchDate) {
        // item.date is ISO string, e.g., "2023-12-03T14:00:00.000Z"
        // searchDate is YYYY-MM-DD
        const itemDateStr = item.date.split('T')[0]; 
        matchesDate = itemDateStr === searchDate;
      }

      return matchesText && matchesDate;
    });
  }, [history, searchTerm, searchDate]);

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                <HistoryIcon className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Histórico de Consultas</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Text Search */}
           <div className="relative flex-1 sm:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <SearchIcon className="h-4 w-4 text-slate-400" />
             </div>
             <input
               type="text"
               className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
               placeholder="Buscar paciente..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           {/* Date Picker */}
           <div className="relative sm:w-40">
             <input
               type="date"
               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm text-slate-600"
               value={searchDate}
               onChange={(e) => setSearchDate(e.target.value)}
             />
           </div>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <FileTextIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">
             {searchTerm || searchDate ? 'Nenhum resultado encontrado' : 'Nenhum histórico encontrado'}
          </h3>
          <p className="text-slate-500 mb-6">
             {searchTerm || searchDate ? 'Tente ajustar os filtros.' : 'Inicie sua primeira consulta para gerar diagnósticos.'}
          </p>
          {!searchTerm && !searchDate && (
              <button 
                onClick={handleNew}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Iniciar Nova Consulta
              </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredHistory.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                     <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        <UserIcon className="w-3 h-3" />
                        {item.patientName || 'Paciente sem nome'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                        • {formatDate(item.date)}
                    </span>
                    {(item.result?.confidence === 'Alta' || item.result?.confidence === 'High') && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto sm:ml-0">Alta Confiança</span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.result?.diagnosis || 'Diagnóstico não identificado'}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-1 mt-1 pr-4">
                    {item.transcript}
                </p>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                 <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;