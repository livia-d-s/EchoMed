export interface MedicalDiagnosis {
  diagnosis: string;
  confidence: string;
  possibleDiseases: string[];
  exams: string[];
  medications: string[];
  rationale: string;
}

export interface Consultation {
  id: string;
  patientName: string; // Added field
  date: string; // ISO string
  transcript: string;
  result: MedicalDiagnosis | null;
}

export interface DoctorProfile {
  name: string;
  specialty: string;
  imageUrl?: string;
}

export interface AnalysisResult {
  formattedTranscript: string;
  diagnosis: MedicalDiagnosis;
}

export enum AppStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED'
}

// ============ PATIENT-CENTRIC TYPES ============

export interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  createdAt: string;
}

export type EventType = 'initial' | 'followup' | 'adjustment';

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: EventType;
  date: string;

  // Consultation data (for initial/followup)
  transcript?: string;
  result?: NutritionalAssessment | MedicalDiagnosis;

  // Adjustment data (for plan changes)
  adjustmentNote?: string;
  previousPlan?: string;
  newPlan?: string;

  doctorName: string;
  createdAt: string;
}

export interface NutritionalAssessment {
  nutritionalAssessment: string;
  clinicalRationale: string;
  possibleAssociatedConditions: string[];
  recommendedExams: string[];
  nutritionalConduct: string;
}