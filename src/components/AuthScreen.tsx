import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  FileBadge,
  Loader2,
  AlertCircle,
  Activity,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { sendPasswordResetEmail, AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const EchoMedLogo = () => (
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-[#2563EB] p-2 rounded-lg">
      <Activity className="w-6 h-6 text-white" />
    </div>
    <span className="text-2xl font-bold text-[#2563EB] tracking-tight">EchoMed</span>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [crm, setCrm] = useState('');

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

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
      const errorCode = (err as AuthError).code;
      let message = "Erro ao enviar e-mail.";
      if (errorCode === 'auth/user-not-found') message = "E-mail não encontrado.";
      else if (errorCode === 'auth/invalid-email') message = "E-mail inválido.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (!fullName.trim()) throw new Error("Nome completo é obrigatório.");
        if (!crm.trim()) throw new Error("CRN é obrigatório.");

        const user = await registerWithEmail(email, password, fullName);
        await setDoc(doc(db, "doctors", user.uid), {
          uid: user.uid,
          fullName,
          email,
          crn: crm,
          specialty: 'Nutricionista',
          createdAt: new Date().toISOString(),
          role: 'nutritionist',
        });
      }
    } catch (err: any) {
      let message = "Ocorreu um erro inesperado.";
      const errorCode = (err as AuthError).code;
      if (errorCode === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      else if (errorCode === 'auth/invalid-email') message = "E-mail inválido.";
      else if (errorCode === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') message = "E-mail ou senha incorretos.";
      else if (err.message) message = err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderContent = () => {
    if (isForgotPassword) {
      return { title: "Redefinir Senha", subtitle: "Informe seu e-mail para receber as instruções" };
    }
    return {
      title: isLogin ? 'Acesse sua conta' : 'Crie sua conta profissional',
      subtitle: isLogin ? 'Gerencie seus pacientes com segurança' : 'Junte-se à nossa rede de nutricionistas'
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
          <h2 className="text-xl font-semibold text-slate-800">{header.title}</h2>
          <p className="text-slate-500 text-sm mt-1">{header.subtitle}</p>
        </div>

        <div className="p-8 pt-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
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
            <>
              {!isForgotPassword && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mb-5"
                  >
                    <GoogleIcon />
                    Continuar com Google
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 uppercase">ou</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </>
              )}

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
                        <FileBadge className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="CRN (Ex: 12345/SP)"
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
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
            </>
          )}

          {!isForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {isLogin ? 'Não tem conta?' : 'Já possui cadastro?'}
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

    </div>
  );
};

export default AuthScreen;
