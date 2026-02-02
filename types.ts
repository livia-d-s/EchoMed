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

export interface TrainingActivity {
  type: string;      // e.g., "Musculação", "Natação", "Corrida"
  frequency: string; // e.g., "3x/semana"
}

export type PatientGoal =
  | 'ganho_muscular'
  | 'perda_gordura'
  | 'manutencao'
  | 'performance'
  | 'forca'
  | 'recuperacao'
  | 'saude_geral'
  | 'outro';

export const GOAL_LABELS: Record<PatientGoal, string> = {
  ganho_muscular: 'Ganho Muscular',
  perda_gordura: 'Perda de Gordura',
  manutencao: 'Manutenção',
  performance: 'Performance',
  forca: 'Força',
  recuperacao: 'Recuperação de Lesão',
  saude_geral: 'Saúde Geral',
  outro: 'Outro'
};

export interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  createdAt: string;
  // New nutrition-focused fields
  goal?: PatientGoal;            // Legacy single goal (for backwards compat)
  goals?: PatientGoal[];         // Supports up to 2 goals
  goalCustom?: string;           // If goal is 'outro'
  trainingRoutine?: TrainingActivity[];
  isFirstConsultation?: boolean; // Tracks if first consultation was done
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