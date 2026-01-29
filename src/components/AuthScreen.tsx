/*import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Stethoscope, 
  FileBadge, 
  ChevronDown, 
  Loader2, 
  AlertCircle, 
  Activity,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// --- Types ---
type Specialty = 
  | "Clínica Geral" 
  | "Dermatologia" 
  | "Fisioterapia" 
  | "Ginecologia" 
  | "Nutricionista" 
  | "Outra";

const SPECIALTIES: Specialty[] = [
  "Clínica Geral",
  "Dermatologia",
  "Fisioterapia",
  "Ginecologia",
  "Nutricionista",
  "Outra"
];

const EchoMedLogo = () => (
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-[#2563EB] p-2 rounded-lg">
      <Activity className="w-6 h-6 text-white" />
    </div>
    <span className="text-2xl font-bold text-[#2563EB] tracking-tight">EchoMed</span>
  </div>
);

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [crm, setCrm] = useState('');
  const [specialty, setSpecialty] = useState<Specialty | ''>('');

  // Toggle Mode Handler
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setResetSent(false);
    setError(null);
    setShowPassword(false);
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setResetSent(false);
    setError(null);
  };

  // Password Reset Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email) {
      setError("Por favor, digite seu e-mail.");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      const errorCode = (err as AuthError).code;
      let message = "Erro ao enviar e-mail.";
      
      if (errorCode === 'auth/user-not-found') {
        message = "E-mail não encontrado.";
      } else if (errorCode === 'auth/invalid-email') {
        message = "E-mail inválido.";
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Main Submit Handler (Login/Register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Usuário logado com sucesso");
      } else {
        // --- REGISTER LOGIC ---
        
        // Basic Validation
        if (!specialty) throw new Error("Por favor, selecione uma especialidade.");
        if (!fullName.trim()) throw new Error("Nome completo é obrigatório.");
        if (!crm.trim()) throw new Error("CRM é obrigatório.");

        // 1. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update Display Name
        await updateProfile(user, { displayName: fullName });

        // 3. Save Extra Data to Firestore
        await setDoc(doc(db, "doctors", user.uid), {
          uid: user.uid,
          fullName,
          email,
          crm,
          specialty,
          createdAt: new Date().toISOString(),
          role: 'doctor'
        });

        console.log("Médico cadastrado com sucesso");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      
      // Friendly Error Messages
      let message = "Ocorreu um erro inesperado.";
      const errorCode = (err as AuthError).code;

      if (errorCode === 'auth/email-already-in-use') {
        message = "Este e-mail já está em uso.";
      } else if (errorCode === 'auth/invalid-email') {
        message = "E-mail inválido.";
      } else if (errorCode === 'auth/weak-password') {
        message = "A senha deve ter pelo menos 6 caracteres.";
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        message = "E-mail ou senha incorretos.";
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic Header Content
  const getHeaderContent = () => {
    if (isForgotPassword) {
      return {
        title: "Redefinir Senha",
        subtitle: "Informe seu e-mail para receber as instruções"
      };
    }
    return {
      title: isLogin ? 'Acesse sua conta' : 'Crie sua conta profissional',
      subtitle: isLogin ? 'Gerencie seus pacientes com segurança' : 'Junte-se à rede de especialistas EchoMed'
    };
  };

  const header = getHeaderContent();

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        
        
        <div className="bg-white p-8 pb-6 text-center border-b border-slate-100 relative">
          
          {isForgotPassword && (
            <button 
              onClick={toggleForgotPassword}
              className="absolute left-6 top-8 text-slate-400 hover:text-slate-600 transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="flex justify-center mb-4">
            <EchoMedLogo />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            {header.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {header.subtitle}
          </p>
        </div>

        
        <div className="p-8 pt-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isForgotPassword && resetSent ? (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">E-mail enviado!</h3>
              <p className="text-slate-500 text-sm mb-6">
                Verifique sua caixa de entrada (e spam) para redefinir sua senha.
              </p>
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="w-full py-3 px-4 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="space-y-5">
              
              {!isLogin && !isForgotPassword && (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Nome Completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-slate-400 text-slate-700 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Stethoscope className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      required
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value as Specialty)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecione a Especialidade</option>
                      {SPECIALTIES.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileBadge className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="CRM (Ex: 12345/SP)"
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-slate-400 text-slate-700 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="E-mail profissional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-slate-400 text-slate-700 bg-slate-50 focus:bg-white"
                />
              </div>

              {!isForgotPassword && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-slate-400 text-slate-700 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#2563EB] transition-colors focus:outline-none"
                    title={showPassword ? "Esconder senha" : "Ver senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div className="flex justify-end">
                  <button 
                    type="button"
                    className="text-sm text-[#2563EB] hover:text-blue-700 font-medium transition-colors"
                    onClick={toggleForgotPassword}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  isForgotPassword 
                    ? 'Enviar Link de Recuperação' 
                    : (isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro')
                )}
              </button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {isLogin ? 'Não tem conta profissional?' : 'Já possui cadastro?'}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-2 font-semibold text-[#2563EB] hover:text-blue-700 transition-colors"
                >
                  {isLogin ? 'Cadastre-se' : 'Faça Login'}
                </button>
              </p>
            </div>
          )}
          
          {isForgotPassword && !resetSent && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 text-center w-full pointer-events-none">
        <p className="text-xs text-slate-400">© 2024 EchoMed. Tecnologia para a vida.</p>
      </div>
    </div>
  );
};

export default AuthScreen;*/