import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, Nutricionista, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Nutricionista | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega a sessão ao inicializar
  useEffect(() => {
    try {
      const session = authService.getSession();
      if (session.user && session.token) {
        setUser(session.user);
        setToken(session.token);
      }
    } catch (err) {
      console.error('Erro ao recuperar sessão:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedUser = await authService.login(credentials);
    setUser(loggedUser);
    const session = authService.getSession();
    setToken(session.token);
  };

  const register = async (credentials: RegisterCredentials) => {
    const registeredUser = await authService.register(credentials);
    setUser(registeredUser);
    const session = authService.getSession();
    setToken(session.token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
