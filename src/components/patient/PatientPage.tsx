import React, { useState } from 'react';
import { Patient, TimelineEvent } from '../../../types';
import { PatientHeader } from './PatientHeader';
import { PatientTimeline } from './PatientTimeline';
import { AdjustmentModal } from './AdjustmentModal';

interface PatientPageProps {
  patient: Patient;
  events: TimelineEvent[];
  onBack: () => void;
  onNewConsultation: (patient: Patient) => void;
  onAddAdjustment: (patientId: string, note: string) => void;
  onEventClick: (event: TimelineEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (eventId: string, newNote: string) => void;
  onEditPatient?: (patientId: string, newName: string) => void;
}

export function PatientPage({
  patient,
  events,
  onBack,
  onNewConsultation,
  onAddAdjustment,
  onEventClick,
  onDeleteEvent,
  onEditEvent,
  onEditPatient
}: PatientPageProps) {
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Filter events for this patient
  const patientEvents = events.filter(e => e.patientId === patient.id);

  const handleSaveAdjustment = (note: string) => {
    onAddAdjustment(patient.id, note);
    setShowAdjustmentModal(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <PatientHeader
        patient={patient}
        onBack={onBack}
        onNewConsultation={() => onNewConsultation(patient)}
        onNewAdjustment={() => setShowAdjustmentModal(true)}
        onEditPatient={onEditPatient}
      />

      <div className="max-w-4xl mx-auto">
        <PatientTimeline
          events={patientEvents}
          onEventClick={onEventClick}
          onDeleteEvent={onDeleteEvent}
          onEditEvent={onEditEvent}
        />
      </div>

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <AdjustmentModal
          patientName={patient.name}
          onSave={handleSaveAdjustment}
          onClose={() => setShowAdjustmentModal(false)}
        />
      )}
    </div>
  );
}
