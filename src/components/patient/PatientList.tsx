import React, { useState, useMemo } from 'react';
import { Search, Users, Calendar } from 'lucide-react';
import { Patient, TimelineEvent } from '../../../types';
import { PatientCard } from './PatientCard';

interface PatientListProps {
  patients: Patient[];
  events: TimelineEvent[];
  onSelectPatient: (patient: Patient) => void;
}

export function PatientList({ patients, events, onSelectPatient }: PatientListProps) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchMode, setSearchMode] = useState<'name' | 'date'>('name');

  // Get patient stats helper
  const getPatientStats = (patientId: string) => {
    const patientEvents = events.filter(e => e.patientId === patientId);
    const consultationEvents = patientEvents.filter(e => e.type !== 'adjustment');
    const sortedEvents = patientEvents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return {
      eventCount: consultationEvents.length, // Only count actual consultations, not adjustments
      lastEventDate: sortedEvents[0]?.date,
      allEventDates: patientEvents.map(e => e.date.split('T')[0])
    };
  };

  // Filter patients by search term or date
  const filteredPatients = useMemo(() => {
    let result = patients;

    // Filter by name
    if (searchMode === 'name' && search.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by date
    if (searchMode === 'date' && dateFilter) {
      result = result.filter(p => {
        const stats = getPatientStats(p.id);
        return stats.allEventDates.includes(dateFilter);
      });
    }

    return result;
  }, [patients, search, dateFilter, searchMode, events]);

  // Sort patients by most recent activity
  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      const aStats = getPatientStats(a.id);
      const bStats = getPatientStats(b.id);
      const aDate = aStats.lastEventDate ? new Date(aStats.lastEventDate).getTime() : 0;
      const bDate = bStats.lastEventDate ? new Date(bStats.lastEventDate).getTime() : 0;
      return bDate - aDate;
    });
  }, [filteredPatients, events]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Meus Pacientes</h2>
          <p className="text-slate-500 text-sm mt-1">
            {filteredPatients.length} de {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}
          </p>
        </div>
      </div>

      {/* Search with mode toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Mode Toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setSearchMode('name'); setDateFilter(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                ${searchMode === 'name' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Search size={14} /> Nome
            </button>
            <button
              onClick={() => { setSearchMode('date'); setSearch(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                ${searchMode === 'date' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Calendar size={14} /> Data
            </button>
          </div>

          {/* Search Input */}
          {searchMode === 'name' ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4
                           outline-none font-medium focus:ring-2 focus:ring-blue-100
                           focus:border-blue-300 transition-all"
              />
            </div>
          ) : (
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4
                           outline-none font-medium focus:ring-2 focus:ring-blue-100
                           focus:border-blue-300 transition-all"
              />
            </div>
          )}

          {/* Clear Filter */}
          {(search || dateFilter) && (
            <button
              onClick={() => { setSearch(''); setDateFilter(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700
                         hover:bg-slate-100 rounded-xl transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {sortedPatients.length > 0 ? (
          sortedPatients.map(patient => {
            const stats = getPatientStats(patient.id);
            return (
              <PatientCard
                key={patient.id}
                patient={patient}
                eventCount={stats.eventCount}
                lastEventDate={stats.lastEventDate}
                onClick={() => onSelectPatient(patient)}
              />
            );
          })
        ) : (
          <div className="py-20 bg-white border-2 border-dashed border-slate-200
                          rounded-[2rem] flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="font-bold text-lg">
              {patients.length === 0
                ? 'Nenhum paciente cadastrado'
                : 'Nenhum paciente encontrado'}
            </p>
            <p className="text-sm mt-1">
              {patients.length === 0
                ? 'Inicie uma consulta para adicionar pacientes'
                : 'Tente buscar por outro nome'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
