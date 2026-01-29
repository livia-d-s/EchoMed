import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Consultation, MedicalDiagnosis, DoctorProfile } from '../../types';

interface AppContextType {
  history: Consultation[];
  currentTranscript: string;
  setCurrentTranscript: (text: string | ((prev: string) => string)) => void;
  currentResult: MedicalDiagnosis | null;
  setCurrentResult: (result: MedicalDiagnosis | null) => void;
  addToHistory: (consultation: Consultation) => void;
  selectedConsultationId: string | null;
  setSelectedConsultationId: (id: string | null) => void;
  doctorProfile: DoctorProfile;
  setDoctorProfile: (profile: DoctorProfile) => void;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: DoctorProfile = {
  name: "Dr. Alexandre",
  specialty: "Nutricionista",
  imageUrl: ""
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [history, setHistory] = useState<Consultation[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentResult, setCurrentResult] = useState<MedicalDiagnosis | null>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(DEFAULT_PROFILE);

  const addToHistory = (consultation: Consultation) => {
    setHistory((prev) => [consultation, ...prev]);
  };

  const resetSession = () => {
    setCurrentTranscript('');
    setCurrentResult(null);
    setSelectedConsultationId(null);
  };

  return (
    <AppContext.Provider
      value={{
        history,
        currentTranscript,
        setCurrentTranscript,
        currentResult,
        setCurrentResult,
        addToHistory,
        selectedConsultationId,
        setSelectedConsultationId,
        doctorProfile,
        setDoctorProfile,
        resetSession
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};