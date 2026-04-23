import React from 'react';
import { Patient, PatientExam } from '../../../types';
import { ExamUploader } from './ExamUploader';

interface PatientExamsProps {
  patient: Patient;
  onUpdateExams: (patientId: string, exams: PatientExam[]) => void;
}

export function PatientExams({ patient, onUpdateExams }: PatientExamsProps) {
  const exams = patient.exams || [];

  const handleChange = (next: PatientExam[]) => {
    onUpdateExams(patient.id, next);
  };

  const confirmedChange = (next: PatientExam[]) => {
    // Protect removals with a confirmation (only when list shrinks)
    if (next.length < exams.length) {
      if (!window.confirm('Remover este exame? Ele não será considerado em análises futuras.')) return;
    }
    handleChange(next);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-5 mb-4 md:mb-6">
      <ExamUploader exams={exams} onChange={confirmedChange} />
    </div>
  );
}
