import React from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Patient } from '../../../types';

interface PatientCardProps {
  patient: Patient;
  eventCount: number;
  lastEventDate?: string;
  onClick: () => void;
}

export function PatientCard({ patient, eventCount, lastEventDate, onClick }: PatientCardProps) {
  const initial = patient.name.charAt(0).toUpperCase();

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
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400
                 hover:shadow-lg cursor-pointer transition-all group"
    >
      <div className="flex gap-4 items-center">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600
                        flex items-center justify-center text-white text-xl font-black
                        group-hover:scale-105 transition-transform flex-shrink-0">
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-lg text-slate-900 truncate">
            {patient.name}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold text-slate-400">
              {eventCount} {eventCount === 1 ? 'consulta' : 'consultas'}
            </span>
            {lastEventDate && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={10} />
                {formatDate(lastEventDate)}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1
                     transition-all flex-shrink-0"
          size={20}
        />
      </div>
    </div>
  );
}
