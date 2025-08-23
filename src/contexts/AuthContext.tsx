import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '@/types/auth';
import { authService } from '@/services/auth';
import { websocketService } from '@/services/websocket';
import { useRouter } from '@/hooks/useRouter';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
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
  const { currentPath } = useRouter();

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

  // WebSocket connection management based on authentication and current path
  useEffect(() => {
    if (isAuthenticated && token && !isLoading) {
      // Check if user is currently in an exam
      const isInExam = currentPath.startsWith('/exam-taking/');
      
      if (!isInExam) {
        // User is not in exam, ensure lobby connection is active
        const currentEndpoint = websocketService.getCurrentEndpoint();
        
        if (currentEndpoint !== '/ws/lobby') {
          console.log('Reconnecting to lobby WebSocket...');
          websocketService.connect(token, '/ws/lobby');
        }
      }
      // If user is in exam, let StudentExamTakingPage handle the connection
    } else if (!isAuthenticated && !isLoading) {
      // User is not authenticated, disconnect WebSocket
      websocketService.disconnect();
    }
  }, [isAuthenticated, token, isLoading, currentPath]);

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

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const userProfile = await authService.getUserProfile(token);
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      isAuthenticated,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};