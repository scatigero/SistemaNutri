import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  // Regra: se autenticado, redireciona automaticamente para o Dashboard
  if (isAuthenticated) {
    return <DashboardPage />;
  }

  // Se não autenticado, renderiza Login ou Cadastro
  return (
    <>
      {currentPage === 'login' ? (
        <LoginPage onNavigateToRegister={() => setCurrentPage('register')} />
      ) : (
        <RegisterPage onNavigateToLogin={() => setCurrentPage('login')} />
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
