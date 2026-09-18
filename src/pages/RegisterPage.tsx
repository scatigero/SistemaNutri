import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação em tempo real do tamanho da senha (mínimo 9 caracteres)
  const isPasswordLengthValid = senha.length >= 9;
  const doPasswordsMatch = senha.length > 0 && senha === confirmarSenha;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas não coincidem. Verifique a confirmação.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        confirmarSenha
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar o cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-50/50">
      {/* Decorative background blur shapes */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Top Logo */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <Logo size="lg" className="mb-3" />
          <p className="text-slate-500 text-sm font-medium">
            Junte-se à comunidade de nutricionistas
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Criar sua conta</h1>
            <p className="text-sm text-slate-500 mt-1">
              Cadastre-se para começar a gerenciar consultas e dietas com precisão.
            </p>
          </div>

          {/* Feedback de erro amigável */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="text-sm font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="register-name"
              label="Nome completo"
              type="text"
              placeholder="Ex: Dra. Ana Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              icon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            <Input
              id="register-email"
              label="E-mail profissional"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Senha
                </label>
                <span className={`text-[11px] font-medium flex items-center gap-1 ${isPasswordLengthValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isPasswordLengthValid && <CheckCircle2 className="w-3 h-3" />}
                  Mínimo 9 caracteres
                </span>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo de 9 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`w-full rounded-xl border bg-white/80 backdrop-blur-sm pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-4 ${
                    senha.length > 0 && !isPasswordLengthValid
                      ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/10'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Confirmar Senha
                </label>
                {confirmarSenha.length > 0 && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${doPasswordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {doPasswordsMatch ? 'Senhas conferem' : 'Senhas diferentes'}
                  </span>
                )}
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita sua senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className={`w-full rounded-xl border bg-white/80 backdrop-blur-sm pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-4 ${
                    confirmarSenha.length > 0 && !doPasswordsMatch
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-semibold text-base py-3.5 flex items-center justify-center gap-2 group"
              isLoading={isSubmitting}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar conta</span>
            </Button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline focus:outline-none transition-colors"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
