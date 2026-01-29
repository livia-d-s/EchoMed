import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Square, Pause, Play, Activity, User, FileText,
  ArrowLeft, Camera, Check, AlertTriangle, Loader2, Users, Pencil, Info, CheckCircle, Trash2
} from 'lucide-react';
import { Patient, TimelineEvent, EventType } from '../types';
import { PatientList, PatientPage } from './components/patient';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, 
  onSnapshot, addDoc, serverTimestamp 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO PARA DEPLOY SEGURO ---
const getFirebaseConfig = () => {
  // 1. Prioridade: Variáveis da Minha Plataforma (Chat)
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }

  // 2. Vite environment variables (import.meta.env)
  const env = (import.meta as any).env || {};

  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || ""
  };

  console.log("🔧 Firebase config loaded:", {
    hasApiKey: !!config.apiKey,
    apiKeyPreview: config.apiKey ? config.apiKey.substring(0, 10) + "..." : "MISSING",
    projectId: config.projectId || "MISSING"
  });

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Safe Firebase initialization with error handling
let app: any = null;
let auth: any = null;
let db: any = null;
let firebaseInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  firebaseInitialized = true;
  console.log("✅ Firebase initialized successfully");
} catch (error: any) {
  console.error("❌ Firebase initialization failed:", error.message);
  console.warn("🔄 Running in OFFLINE MODE - App will work without cloud sync");
  console.warn("📖 See FIREBASE_SETUP.md for configuration help");
  firebaseInitialized = false;
}

// Chaves de apoio - Resolvendo import.meta de forma segura
const appId = typeof __app_id !== 'undefined' ? __app_id : 'echomed-deploy-app';

const getBackendUrl = () => {
  // In production (Vercel), use relative URL (empty string)
  // In development, use localhost
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return ''; // Production - use relative URLs
  }
  try {
    const env = (import.meta as any)?.env || {};
    return env.VITE_BACKEND_URL || "http://localhost:3001";
  } catch {
    return "http://localhost:3001";
  }
};

const backendUrl = getBackendUrl();

// Normalize patient names: proper case + remove special characters
const normalizePatientName = (name: string): string => {
  // Remove special characters: .;'"[{}]
  let cleaned = name.replace(/[.;'"[\]{}]/g, '');

  // Convert to proper case (Title Case)
  // Split by spaces, capitalize first letter of each word, lowercase the rest
  return cleaned
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AppStatus = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  PROCESSING: 'processing',
  RESULT: 'result'
};

export default function App() {
  const [view, setView] = useState<'transcription' | 'diagnosis' | 'patients' | 'patient'>('transcription');
  const [status, setStatus] = useState(AppStatus.IDLE);
  const [user, setUser] = useState(null);

  // Patient-centric state
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('echomed_patients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading patients from localStorage:', e);
      }
    }
    return [];
  });

  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem('echomed_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading events from localStorage:', e);
      }
    }
    return [];
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [doctorProfile, setDoctorProfile] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('echomed_doctor_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading profile from localStorage:', e);
      }
    }
    return {
      name: "Nutricionista",
      specialty: "Nutrição Clínica",
      photo: null as string | null,
      crm: ""
    };
  });
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Save doctor profile to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('echomed_doctor_profile', JSON.stringify(doctorProfile));
  }, [doctorProfile]);
  const [patientName, setPatientName] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [history, setHistory] = useState(() => {
    // Load history from localStorage on initial render
    const saved = localStorage.getItem('echomed_consultation_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading history from localStorage:', e);
      }
    }
    return [];
  });
  const [currentResult, setCurrentResult] = useState(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Show toast notification
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  // Save history to localStorage when it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('echomed_consultation_history', JSON.stringify(history));
    }
  }, [history]);

  // Save patients to localStorage
  useEffect(() => {
    localStorage.setItem('echomed_patients', JSON.stringify(patients));
  }, [patients]);

  // Normalize existing patient names (runs once on app load)
  useEffect(() => {
    if (patients.length > 0) {
      const needsNormalization = patients.some(p => p.name !== normalizePatientName(p.name));
      if (needsNormalization) {
        const normalizedPatients = patients.map(p => ({
          ...p,
          name: normalizePatientName(p.name)
        }));
        // Merge duplicates that may appear after normalization
        const uniqueMap = new Map<string, Patient>();
        normalizedPatients.forEach(p => {
          const key = p.name.toLowerCase();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, p);
          }
        });
        setPatients(Array.from(uniqueMap.values()));
        console.log('✅ Patient names normalized');
      }
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('echomed_events', JSON.stringify(events));
  }, [events]);

  // Migrate existing history to patient-centric format (runs once)
  useEffect(() => {
    if (history.length > 0 && patients.length === 0) {
      const migratedPatients: Patient[] = [];
      const migratedEvents: TimelineEvent[] = [];
      const patientMap = new Map<string, Patient>();

      history.forEach((item: any, index: number) => {
        const rawPatientName = item.patient || 'Anônimo';
        const normalizedDisplayName = normalizePatientName(rawPatientName);
        const normalizedKey = normalizedDisplayName.toLowerCase();

        // Create or get patient
        let patient = patientMap.get(normalizedKey);
        if (!patient) {
          patient = {
            id: `patient_${Date.now()}_${index}`,
            name: normalizedDisplayName,
            createdAt: item.createdAt || new Date().toISOString()
          };
          patientMap.set(normalizedKey, patient);
          migratedPatients.push(patient);
        }

        // Determine event type (first event for patient = initial, others = followup)
        const existingEventsForPatient = migratedEvents.filter(e => e.patientId === patient!.id);
        const eventType: EventType = existingEventsForPatient.length === 0 ? 'initial' : 'followup';

        // Create event
        const event: TimelineEvent = {
          id: item.id || `event_${Date.now()}_${index}`,
          patientId: patient.id,
          type: eventType,
          date: item.createdAt || new Date().toISOString(),
          transcript: item.transcript,
          result: item.result,
          doctorName: item.doctorName || 'Nutricionista',
          createdAt: item.createdAt || new Date().toISOString()
        };
        migratedEvents.push(event);
      });

      if (migratedPatients.length > 0) {
        setPatients(migratedPatients);
        setEvents(migratedEvents);
        console.log(`✅ Migrated ${migratedPatients.length} patients and ${migratedEvents.length} events`);
      }
    }
  }, [history, patients.length]);

  // Helper to find or create patient
  const findOrCreatePatient = (name: string): Patient => {
    const normalizedName = normalizePatientName(name);
    const normalizedLower = normalizedName.toLowerCase();
    const existing = patients.find(p => p.name.toLowerCase() === normalizedLower);
    if (existing) return existing;

    const newPatient: Patient = {
      id: `patient_${Date.now()}`,
      name: normalizedName,
      createdAt: new Date().toISOString()
    };
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  // Add event for patient
  const addEventForPatient = (patientId: string, type: EventType, result: any, transcript?: string) => {
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      patientId,
      type,
      date: new Date().toISOString(),
      transcript,
      result,
      doctorName: doctorProfile.name,
      createdAt: new Date().toISOString()
    };
    setEvents(prev => [newEvent, ...prev]);
    return newEvent;
  };

  // Add adjustment for patient
  const addAdjustmentForPatient = (patientId: string, note: string) => {
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      patientId,
      type: 'adjustment',
      date: new Date().toISOString(),
      adjustmentNote: note,
      doctorName: doctorProfile.name,
      createdAt: new Date().toISOString()
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  // Delete event (mainly for adjustments)
  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // Edit event note (for adjustments)
  const editEventNote = (eventId: string, newNote: string) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, adjustmentNote: newNote } : e
    ));
  };

  // Edit patient name
  const editPatient = (patientId: string, newName: string) => {
    const normalizedName = normalizePatientName(newName);
    if (!normalizedName.trim()) return;

    // Update patient
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, name: normalizedName } : p
    ));

    // Update selectedPatient if it's the one being edited
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(prev => prev ? { ...prev, name: normalizedName } : null);
    }
  };

  // --- Auth & Listeners ---
  useEffect(() => {
    const initAuth = async () => {
      // Skip auth if Firebase didn't initialize
      if (!firebaseInitialized || !auth) {
        console.warn("⚠️ Firebase not initialized - running in OFFLINE MODE");
        console.warn("📝 The app will work but history won't be saved");
        return;
      }

      try {
        // Debug: Log config status
        console.log("Firebase config loaded:", {
          hasApiKey: !!firebaseConfig.apiKey,
          projectId: firebaseConfig.projectId
        });

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          console.log("Attempting custom token auth...");
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20) {
          console.log("Attempting anonymous auth...");
          await signInAnonymously(auth);
          console.log("✅ Anonymous auth successful!");
        } else {
          console.warn("⚠️ No valid Firebase API key found - running in OFFLINE MODE");
          console.warn("📝 History and cloud sync disabled. See FIREBASE_SETUP.md to configure.");
        }
      } catch (err: any) {
        console.error("❌ Firebase Auth Error:", err);
        console.error("Error code:", err?.code);
        console.error("Error message:", err?.message);

        // Provide helpful error messages with links
        if (err?.code === 'auth/operation-not-allowed') {
          console.error("⚠️ SOLUTION: Enable Anonymous Authentication");
          console.error("🔗 Go to: https://console.firebase.google.com/project/" + firebaseConfig.projectId + "/authentication/providers");
          console.error("📋 Steps: Click 'Anonymous' → Toggle 'Enable' → Save");
        } else if (err?.code === 'auth/api-key-not-valid' || err?.code === 'auth/invalid-api-key') {
          console.error("⚠️ SOLUTION: Update your Firebase API Key");
          console.error("🔗 Go to: https://console.firebase.google.com/project/" + firebaseConfig.projectId + "/settings/general");
          console.error("📋 See FIREBASE_SETUP.md for detailed instructions");
        }

        console.warn("🔄 Continuing in OFFLINE MODE - history will not be saved");
      }
    };

    initAuth();

    // Only set up auth listener if Firebase is properly initialized
    let unsubscribe = () => {};
    if (firebaseInitialized && auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, (u: any) => {
          if (u) {
            console.log("✅ User authenticated:", u.uid);
            setUser(u);
          }
        });
      } catch (error) {
        console.error("Failed to set up auth listener:", error);
      }
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !firebaseConfig.apiKey || !db) return;

    try {
      const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'consultations');
      const unsubscribe = onSnapshot(historyRef, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHistory(data.sort((a:any, b:any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) as any);
      }, (err) => console.error("Firestore Listen Error:", err));

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to set up Firestore listener:", error);
    }
  }, [user]);

  // --- Lógica de IA ---
  const callGeminiAI = async (text: string) => {
    // Agora chamamos o backend seguro ao invés de chamar o Gemini diretamente
    const response = await fetch(`${backendUrl}/api/analyze-medical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Erro ao processar análise");
    }

    return await response.json();
  };

  const finalizeConsultation = async () => {
    if (!currentTranscript.trim()) return;
    setStatus(AppStatus.PROCESSING);
    try {
      const aiResponse = await callGeminiAI(currentTranscript);
      const now = new Date().toISOString();

      // Create consultation record (legacy format for backward compatibility)
      const consultationRecord = {
        id: Date.now().toString(),
        patient: patientName || 'Anônimo',
        diagnosis: aiResponse.nutritionalAssessment || aiResponse.diagnosis,
        result: aiResponse,
        transcript: currentTranscript,
        createdAt: now,
        doctorName: doctorProfile.name
      };

      // Save to local history (always works, even offline)
      setHistory((prev: any) => [consultationRecord, ...prev]);

      // === Patient-centric storage ===
      const patient = findOrCreatePatient(patientName || 'Anônimo');

      // Determine if this is initial or followup
      const patientEvents = events.filter(e => e.patientId === patient.id);
      const eventType: EventType = patientEvents.length === 0 ? 'initial' : 'followup';

      // Create timeline event
      addEventForPatient(patient.id, eventType, aiResponse, currentTranscript);

      // Also try to save to Firebase if available
      if (user && firebaseConfig.apiKey && db) {
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'consultations'), {
            patient: patientName || 'Anônimo',
            diagnosis: aiResponse.nutritionalAssessment || aiResponse.diagnosis,
            result: aiResponse,
            transcript: currentTranscript,
            createdAt: serverTimestamp(),
            doctorName: doctorProfile.name
          });
        } catch (dbError) {
          console.error("Failed to save to Firebase:", dbError);
          console.warn("Analysis completed but not saved to cloud (offline mode)");
        }
      }
      setCurrentResult(aiResponse);
      setView('diagnosis');
      showToast('Análise salva com sucesso');
      localStorage.removeItem('echomed_autosave'); // Clear autosave after successful analysis
    } catch (error: any) {
      console.error("Erro na análise:", error);
      alert(`Erro na análise: ${error.message}\n\nVerifique se o servidor backend está rodando em ${backendUrl}`);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentTranscript(''); setPatientName(''); setCurrentResult(null); setView('transcription'); }}>
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200"><Activity size={22} /></div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none">EchoMed</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Medical Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setView('transcription')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'transcription' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Consulta</button>
              <button onClick={() => { setView('patients'); setSelectedPatient(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${view === 'patients' || view === 'patient' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                <Users size={14} /> Pacientes
              </button>
            </div>
            {/* Profile Picture Button */}
            <button
              onClick={() => setShowProfilePopup(true)}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-colors cursor-pointer bg-slate-100 flex items-center justify-center"
            >
              {doctorProfile.photo ? (
                <img src={doctorProfile.photo} alt="Foto do perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {view === 'transcription' && (
          <TranscriptionView
            status={status} setStatus={setStatus}
            patientName={patientName} setPatientName={setPatientName}
            transcript={currentTranscript} setTranscript={setCurrentTranscript}
            onFinalize={finalizeConsultation}
            patients={patients}
            events={events}
          />
        )}
        {view === 'patients' && (
          <PatientList
            patients={patients}
            events={events}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              setView('patient');
            }}
          />
        )}
        {view === 'patient' && selectedPatient && (
          <PatientPage
            patient={selectedPatient}
            events={events}
            onBack={() => {
              setSelectedPatient(null);
              setView('patients');
            }}
            onNewConsultation={(patient) => {
              setPatientName(patient.name);
              setView('transcription');
            }}
            onAddAdjustment={addAdjustmentForPatient}
            onDeleteEvent={deleteEvent}
            onEditEvent={editEventNote}
            onEditPatient={editPatient}
            onEventClick={(event) => {
              setSelectedEvent(event);
              if (event.result) {
                setCurrentResult(event.result);
                setPatientName(selectedPatient.name);
                setView('diagnosis');
              }
            }}
          />
        )}
        {view === 'diagnosis' && <DiagnosisView result={currentResult} patientName={patientName} onBack={() => { setView(selectedPatient ? 'patient' : 'transcription'); setCurrentTranscript(''); if (!selectedPatient) setPatientName(''); }} />}
      </main>

      {/* Profile Popup */}
      {showProfilePopup && (
        <ProfilePopup
          profile={doctorProfile}
          onSave={(newProfile: any) => { setDoctorProfile(newProfile); setShowProfilePopup(false); }}
          onClose={() => setShowProfilePopup(false)}
        />
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl">
            <CheckCircle size={18} className="text-green-400" />
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePopup({ profile, onSave, onClose }: any) {
  const [name, setName] = useState(profile.name || '');
  const [specialty, setSpecialty] = useState(profile.specialty || '');
  const [photo, setPhoto] = useState<string | null>(profile.photo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      ...profile,
      name: name.trim() || 'Nutricionista',
      specialty: specialty.trim() || 'Nutrição Clínica',
      photo
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleSave}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-slate-900">Meu Perfil</h3>
          <p className="text-slate-500 mt-1">Configure sua foto e informações</p>
        </div>

        {/* Photo Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-200 hover:border-blue-400 transition-colors cursor-pointer bg-slate-100 flex items-center justify-center"
            >
              {photo ? (
                <img src={photo} alt="Foto do perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-400" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome</label>
          <input
            type="text"
            placeholder="Seu nome..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Specialty Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Especialidade</label>
          <input
            type="text"
            placeholder="Sua especialidade..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        {/* Remove Photo Button */}
        {photo && (
          <button
            onClick={() => setPhoto(null)}
            className="w-full py-2 mb-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Remover foto
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function TranscriptionView({ status, setStatus, patientName, setPatientName, transcript, setTranscript, onFinalize, patients, events }: any) {
  const recognitionRef = useRef<any>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [interim, setInterim] = useState('');
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [tempName, setTempName] = useState('');
  const [pendingAction, setPendingAction] = useState<'record' | 'finalize' | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);
  const [nameWarning, setNameWarning] = useState('');
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);

  // Format elapsed time as MM:SS
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update timer every second while recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === AppStatus.RECORDING && recordingStartTime) {
      interval = setInterval(() => {
        const currentSessionTime = Math.floor((Date.now() - recordingStartTime) / 1000);
        setElapsedTime(accumulatedTime + currentSessionTime);
      }, 1000);
    }
    // Don't reset on pause - only on IDLE (after finishing)
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, recordingStartTime, accumulatedTime]);

  // Check if name is complete (has at least 2 words)
  const isNameComplete = (name: string) => {
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length >= 2;
  };

  // Get last visit date for a patient
  const getLastVisitDate = (patientId: string) => {
    const patientEvents = events?.filter((e: any) => e.patientId === patientId) || [];
    if (patientEvents.length === 0) return null;
    const sorted = patientEvents.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0]?.date;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Patient name suggestions with last visit info
  const suggestions = patients?.filter((p: any) =>
    patientName.trim() &&
    p.name.toLowerCase().includes(patientName.toLowerCase()) &&
    p.name.toLowerCase() !== patientName.toLowerCase()
  ).map((p: any) => ({
    ...p,
    lastVisit: getLastVisitDate(p.id)
  })).slice(0, 5) || [];

  // Auto-save transcript to localStorage
  useEffect(() => {
    if (transcript && patientName) {
      const autoSaveData = { patientName, transcript, timestamp: Date.now() };
      localStorage.setItem('echomed_autosave', JSON.stringify(autoSaveData));
      setAutoSaveIndicator(true);
      const timer = setTimeout(() => setAutoSaveIndicator(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [transcript, patientName]);

  // Restore auto-saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('echomed_autosave');
    if (saved && !transcript) {
      try {
        const { patientName: savedName, transcript: savedTranscript, timestamp } = JSON.parse(saved);
        // Only restore if less than 1 hour old
        if (Date.now() - timestamp < 3600000 && savedTranscript) {
          if (window.confirm('Há uma transcrição não finalizada. Deseja restaurar?')) {
            setPatientName(savedName || '');
            setTranscript(savedTranscript);
          } else {
            localStorage.removeItem('echomed_autosave');
          }
        }
      } catch (e) {
        console.error('Error restoring autosave:', e);
      }
    }
  }, []);

  // Auto-scroll to bottom when transcript changes (teleprompter effect)
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTo({
        top: transcriptContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript, interim]);

  const checkPatientName = (action: 'record' | 'finalize') => {
    if (!patientName.trim()) {
      setPendingAction(action);
      setTempName('');
      setShowNamePopup(true);
      return false;
    }
    return true;
  };

  const handleNameSubmit = () => {
    if (!tempName.trim()) return;
    setPatientName(normalizePatientName(tempName));
    setShowNamePopup(false);
    if (pendingAction === 'record') {
      setTimeout(() => doStartRecording(), 100);
    } else if (pendingAction === 'finalize') {
      setTimeout(() => onFinalize(), 100);
    }
    setPendingAction(null);
  };

  const doStartRecording = (isResume = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Seu navegador não suporta reconhecimento de voz.");
        return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'pt-BR';
    recognitionRef.current.onresult = (event: any) => {
      let f = '', i = '';
      for (let x = event.resultIndex; x < event.results.length; ++x) {
        if (event.results[x].isFinal) f += event.results[x][0].transcript;
        else i += event.results[x][0].transcript;
      }
      if (f) setTranscript((prev: string) => prev + ' ' + f);
      setInterim(i);
    };
    recognitionRef.current.start();
    setRecordingStartTime(Date.now());
    // Only reset accumulated time if starting fresh (not resuming)
    if (!isResume) {
      setAccumulatedTime(0);
      setElapsedTime(0);
    }
    setStatus(AppStatus.RECORDING);
  };

  const startRecording = () => {
    if (checkPatientName('record')) {
      doStartRecording(false);
    }
  };

  const resumeRecording = () => {
    doStartRecording(true);
  };

  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // Save accumulated time when pausing
      if (recordingStartTime) {
        const currentSessionTime = Math.floor((Date.now() - recordingStartTime) / 1000);
        setAccumulatedTime(prev => prev + currentSessionTime);
      }
      setStatus(AppStatus.PAUSED);
      setInterim('');
      setRecordingStartTime(null);
    }
  };

  const handleFinalize = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Reset timer state
    setRecordingStartTime(null);
    setAccumulatedTime(0);
    setElapsedTime(0);
    setInterim('');
    setStatus(AppStatus.IDLE);
    onFinalize();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
            <input
              placeholder="Nome Completo do Paciente..."
              className={`w-full bg-white border rounded-2xl py-4 pl-12 pr-6 outline-none font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all ${
                nameWarning ? 'border-amber-300' : 'border-slate-200'
              }`}
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                setShowSuggestions(true);
                setNameWarning('');
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150);
                if (patientName.trim()) {
                  const normalized = normalizePatientName(patientName);
                  setPatientName(normalized);
                  if (!isNameComplete(normalized)) {
                    setNameWarning('Recomendado: nome completo para evitar confusão entre pacientes');
                  }
                }
              }}
            />
            {/* Name warning */}
            {nameWarning && (
              <p className="absolute -bottom-6 left-0 text-xs text-amber-600 font-medium">
                {nameWarning}
              </p>
            )}
            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-20">
                {suggestions.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors"
                    onMouseDown={() => { setPatientName(p.name); setShowSuggestions(false); setNameWarning(''); }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-700 block">{p.name}</span>
                      {p.lastVisit && (
                        <span className="text-xs text-slate-400">Última consulta: {formatDate(p.lastVisit)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>
        <div className="flex items-center gap-2">
          {autoSaveIndicator && (
            <span className="text-xs text-green-600 font-medium animate-in fade-in duration-300">Salvo</span>
          )}
          {status === AppStatus.RECORDING && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-lg font-black text-red-600 tabular-nums">{formatElapsedTime(elapsedTime)}</span>
            </div>
          )}
          {status === AppStatus.PAUSED && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
              <Pause size={14} className="text-amber-600" />
              <span className="text-lg font-black text-amber-600 tabular-nums">{formatElapsedTime(elapsedTime)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl h-[450px] flex flex-col relative overflow-hidden">
        <div
          ref={transcriptContainerRef}
          className="h-[320px] p-8 md:p-12 overflow-y-auto scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
        >
          {transcript || interim ? (
            <p className="text-2xl font-medium text-slate-800 leading-relaxed">{transcript}<span className="text-blue-400 animate-pulse">{interim}</span></p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
              <Mic size={48} />
              <p className="font-bold text-center px-8 text-xl">Inicie a consulta para transcrever a voz em tempo real.</p>
            </div>
          )}
        </div>
        
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center gap-4">
          {status === AppStatus.IDLE && (
            <button onClick={startRecording} className="flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
              <Mic size={24} /> Iniciar Consulta
            </button>
          )}
          {status === AppStatus.RECORDING && (
            <div className="flex gap-4">
              <button onClick={pauseRecording} className="flex items-center gap-3 bg-amber-500 text-white px-6 py-5 rounded-[2rem] font-black text-lg shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all">
                <Pause size={24} /> Pausar
              </button>
              <button onClick={handleFinalize} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all">
                <Square size={18} fill="currentColor" /> Finalizar
              </button>
            </div>
          )}
          {status === AppStatus.PAUSED && (
            <div className="flex gap-4">
              <button onClick={resumeRecording} className="flex items-center gap-3 bg-green-500 text-white px-6 py-5 rounded-[2rem] font-black text-lg shadow-lg shadow-green-200 hover:bg-green-600 active:scale-95 transition-all">
                <Play size={24} fill="currentColor" /> Retomar
              </button>
              <button onClick={handleFinalize} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all">
                <Square size={18} fill="currentColor" /> Finalizar
              </button>
            </div>
          )}
        </div>

        {status === AppStatus.PROCESSING && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={56} />
            <h2 className="text-2xl font-black">Inteligência EchoMed Ativa</h2>
            <p className="text-slate-500 font-bold mt-2">Cruzando sintomas e dados clínicos...</p>
          </div>
        )}
      </div>

      {/* Patient Name Popup */}
      {showNamePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Nome Completo do Paciente</h3>
              <p className="text-slate-500 mt-2">Por favor, informe o nome completo para evitar confusão entre pacientes.</p>
            </div>
            <input
              type="text"
              placeholder="Ex: Maria Silva Santos"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none font-bold text-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all mb-4"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNamePopup(false); setPendingAction(null); }}
                className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleNameSubmit}
                disabled={!tempName.trim()}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosisView({ result, patientName, onBack }: any) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedRationale, setEditedRationale] = useState('');
  const [editedConduct, setEditedConduct] = useState('');
  const [editedConditions, setEditedConditions] = useState<string[]>([]);
  const [editedExams, setEditedExams] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'condition' | 'exam'; index: number } | null>(null);

  if (!result) return null;

  // Support both nutritional and medical field names
  const title = result.nutritionalAssessment || result.diagnosis;
  const rationale = editedRationale || result.clinicalRationale || result.rationale;
  const conduct = editedConduct || result.nutritionalConduct || result.treatment;
  const conditions = editedConditions.length > 0 ? editedConditions : (result.possibleAssociatedConditions || result.possibleDiseases || []);
  const exams = editedExams.length > 0 ? editedExams : (result.recommendedExams || result.exams || []);

  // Parse conduct into sequential steps
  const parseSteps = (text: string): string[] => {
    if (!text) return [];
    const numberedPattern = /\d+\.\s*/;
    if (numberedPattern.test(text)) {
      return text.split(numberedPattern).filter(s => s.trim().length > 0);
    }
    if (text.includes(';')) {
      return text.split(';').map(s => s.trim()).filter(s => s.length > 0);
    }
    const sentences = text.split(/\.\s+/).filter(s => s.trim().length > 10);
    return sentences.length > 1 ? sentences : [text];
  };

  const conductSteps = parseSteps(conduct);

  const getPriorityLabel = (index: number): { label: string; color: string } => {
    if (index === 0) return { label: 'Prioritário', color: 'bg-red-400' };
    if (index === 1) return { label: 'Importante', color: 'bg-amber-400' };
    return { label: 'Complementar', color: 'bg-blue-300' };
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    if (section === 'rationale') setEditedRationale(rationale);
    if (section === 'conduct') setEditedConduct(conduct);
    if (section === 'conditions') setEditedConditions([...conditions]);
    if (section === 'exams') setEditedExams([...exams]);
  };

  const saveEditing = () => {
    setEditingSection(null);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditedRationale('');
    setEditedConduct('');
    setEditedConditions([]);
    setEditedExams([]);
  };

  // Delete item from conditions or exams
  const confirmDeleteItem = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'condition') {
      const newConditions = conditions.filter((_: string, i: number) => i !== deleteConfirm.index);
      setEditedConditions(newConditions);
    } else {
      const newExams = exams.filter((_: string, i: number) => i !== deleteConfirm.index);
      setEditedExams(newExams);
    }
    setDeleteConfirm(null);
  };

  // Edit button component
  const EditButton = ({ section }: { section: string }) => (
    <button
      onClick={() => startEditing(section)}
      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600
                 hover:bg-blue-50 rounded-lg transition-all"
      title="Editar"
    >
      <Pencil size={12} />
    </button>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex-1">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-3 hover:gap-3 transition-all">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">{title}</h2>
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-widest">
          <User size={14} /> <span>{patientName}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Rationale */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 group relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-blue-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Activity size={14} /> Racional Clínico
              </h3>
              {editingSection !== 'rationale' && <EditButton section="rationale" />}
            </div>
            {editingSection === 'rationale' ? (
              <div className="space-y-3">
                <textarea
                  value={editedRationale}
                  onChange={(e) => setEditedRationale(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl text-lg text-slate-700 leading-relaxed resize-none focus:ring-2 focus:ring-blue-100 outline-none"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEditing} className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={saveEditing} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                </div>
              </div>
            ) : (
              <p className="text-lg text-slate-700 leading-relaxed">{rationale}</p>
            )}
          </div>

          {/* Nutritional Conduct - Sequential Steps */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl group relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-blue-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Check size={14} /> Conduta Nutricional
              </h3>
              {editingSection !== 'conduct' && (
                <button
                  onClick={() => startEditing('conduct')}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-400
                             hover:bg-slate-800 rounded-lg transition-all"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {editingSection === 'conduct' ? (
              <div className="space-y-3">
                <textarea
                  value={editedConduct}
                  onChange={(e) => setEditedConduct(e.target.value)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-lg text-white leading-relaxed resize-none focus:ring-2 focus:ring-blue-400 outline-none"
                  rows={6}
                  placeholder="Separe os passos por ponto e vírgula (;) ou numere (1. 2. 3.)"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEditing} className="px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={saveEditing} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">Salvar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conductSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30
                                    flex items-center justify-center text-blue-400 font-black text-sm">
                      {i + 1}
                    </div>
                    <p className="text-lg leading-relaxed pt-1 text-slate-100">{step.trim().replace(/\.$/, '')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Associated Conditions */}
          {(conditions.length > 0 || editingSection === 'conditions') && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 group relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  <AlertTriangle size={14} /> Atenção
                </h3>
                {editingSection !== 'conditions' && <EditButton section="conditions" />}
              </div>
              {editingSection === 'conditions' ? (
                <div className="space-y-2">
                  {editedConditions.map((c, i) => (
                    <input
                      key={i}
                      value={c}
                      onChange={(e) => {
                        const updated = [...editedConditions];
                        updated[i] = e.target.value;
                        setEditedConditions(updated);
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    />
                  ))}
                  <div className="flex gap-2 justify-end mt-3">
                    <button onClick={cancelEditing} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={saveEditing} className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600">Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {conditions.map((d: string, i: number) => (
                    <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-100 font-medium text-slate-700 text-sm flex items-center justify-between gap-2 group/item">
                      <span>{d}</span>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'condition', index: i })}
                        className="opacity-0 group-hover/item:opacity-50 hover:!opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exams - Priority Ordered */}
          {(exams.length > 0 || editingSection === 'exams') && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 group relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <FileText size={14} /> Exames Solicitados
                </h3>
                {editingSection !== 'exams' && <EditButton section="exams" />}
              </div>
              {editingSection === 'exams' ? (
                <div className="space-y-2">
                  {editedExams.map((e, i) => (
                    <input
                      key={i}
                      value={e}
                      onChange={(ev) => {
                        const updated = [...editedExams];
                        updated[i] = ev.target.value;
                        setEditedExams(updated);
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    />
                  ))}
                  <div className="flex gap-2 justify-end mt-3">
                    <button onClick={cancelEditing} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={saveEditing} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {exams.map((e: string, i: number) => {
                    const priority = getPriorityLabel(i);
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl group/item">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priority.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 text-sm">{e}</p>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{priority.label}</span>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'exam', index: i })}
                          className="opacity-0 group-hover/item:opacity-50 hover:!opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 mt-0.5"
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ethical Disclaimer - Discreet */}
      <div className="flex items-start gap-2 pt-4 border-t border-slate-100">
        <Info size={12} className="text-slate-300 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Análise gerada por inteligência artificial como suporte à decisão clínica.
          O profissional de saúde é responsável pela validação e conduta final.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Confirmar exclusão</h3>
              <p className="text-slate-500 text-sm mt-2">
                Tem certeza que quer deletar este {deleteConfirm.type === 'condition' ? 'item de atenção' : 'exame'}? Não é possível recuperar depois.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteItem}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}