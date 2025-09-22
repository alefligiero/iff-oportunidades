export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'COMPANY';
  name?: string; // Nome do usuário (do perfil específico)
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface AuthError {
  message: string;
  field?: string;
}
