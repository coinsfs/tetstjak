import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/auth';
import { authService } from '../services/authService';
import { websocketService } from '../services/websocketService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      if (savedToken) {
        try {
          const userProfile = await authService.getUserProfile(savedToken);
          setUser(userProfile);
          setToken(savedToken);
          // Initialize WebSocket connection
          websocketService.connect(savedToken);
        } catch (error) {
          localStorage.removeItem('access_token');
          console.error('Failed to initialize auth:', error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await authService.login(username, password);
      const userProfile = await authService.getUserProfile(response.access_token);
      
      setToken(response.access_token);
      setUser(userProfile);
      localStorage.setItem('access_token', response.access_token);
      
      // Initialize WebSocket connection
      websocketService.connect(response.access_token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    websocketService.disconnect();
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};