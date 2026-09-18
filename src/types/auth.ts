export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at?: string;
}

export interface AuthState {
  user: Nutricionista | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterCredentials {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}
