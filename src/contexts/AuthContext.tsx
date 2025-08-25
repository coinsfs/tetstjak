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

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      if (savedToken) {
        try {
          const userProfile = await authService.getUserProfile(savedToken);
          setUser(userProfile);
          setToken(savedToken);
        } catch (error) {
          localStorage.removeItem('access_token');
          console.error('Failed to initialize auth:', error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Centralized WebSocket connection management
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && token) {
        // Determine the correct WebSocket endpoint based on current path
        let desiredEndpoint = '/ws/lobby'; // Default endpoint
        
        // Check if user is in exam-taking page
        if (currentPath.startsWith('/exam-taking/')) {
          const sessionId = currentPath.split('/').pop();
          if (sessionId) {
            // Extract examId from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const examIdParam = urlParams.get('examId');
            
            if (examIdParam) {
              try {
                const decodedExamId = atob(examIdParam.padEnd(examIdParam.length + (4 - examIdParam.length % 4) % 4, '='));
                desiredEndpoint = `/ws/exam-room/${decodedExamId}`;
              } catch (error) {
                console.warn('Failed to decode examId, using sessionId as fallback');
                desiredEndpoint = `/ws/exam-room/${sessionId}`;
              }
            } else {
              desiredEndpoint = `/ws/exam-room/${sessionId}`;
            }
          }
        }
        // Check if user is in proctor monitoring page
        else if (currentPath.startsWith('/monitor-exam/')) {
          const examId = currentPath.split('/').pop();
          if (examId) {
            desiredEndpoint = `/ws/exam-room/${examId}`;
          }
        }
        
        // Get current WebSocket endpoint
        const currentEndpoint = websocketService.getCurrentEndpoint();
        const isConnected = websocketService.isConnected();
        const connectionState = websocketService.getConnectionState();
        
        console.log('AuthContext: WebSocket connection check:', {
          currentEndpoint,
          desiredEndpoint,
          isConnected,
          connectionState,
          currentPath
        });
        
        // Only connect if endpoint is different, no connection exists, or connection is broken
        const shouldConnect = currentEndpoint !== desiredEndpoint || 
                             !isConnected || 
                             (connectionState.readyState !== undefined && 
                              connectionState.readyState !== WebSocket.OPEN && 
                              !connectionState.isReconnecting);
        
        if (shouldConnect) {
          console.log(`WebSocket: Switching from ${currentEndpoint || 'none'} to ${desiredEndpoint}`);
          
          // Disconnect existing connection cleanly
          if (currentEndpoint && isConnected) {
            console.log('AuthContext: Disconnecting existing connection before switching');
            websocketService.disconnect();
          }
          
          // Connect immediately - no setTimeout wrapper needed
          const onAuthError = () => {
            console.error('WebSocket authentication failed');
            logout();
          };

          const onStatusChange = (status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => {
            console.log(`WebSocket status changed to: ${status} for endpoint: ${desiredEndpoint}`);
            
            // Handle reconnection logic more carefully
            if (status === 'disconnected' || status === 'error') {
              // Only attempt reconnection if we're still on the same path and authenticated
              const currentDesiredEndpoint = getCurrentDesiredEndpoint();
              if (currentDesiredEndpoint === desiredEndpoint && isAuthenticated && token) {
                console.log('WebSocket: Connection lost, will attempt reconnection...');
              }
            }
          };

          websocketService.connect(token, desiredEndpoint, onAuthError, onStatusChange);
        } else {
          console.log('AuthContext: WebSocket connection check - no action needed:', {
            reason: currentEndpoint === desiredEndpoint ? 'same endpoint' : 
                   isConnected ? 'already connected' : 'reconnecting in progress'
          });
        }
      } else {
        // User is not authenticated, disconnect WebSocket
        console.log('WebSocket: User not authenticated, disconnecting');
        websocketService.disconnect();
      }
    }

    // Helper function to get current desired endpoint
    function getCurrentDesiredEndpoint(): string {
      if (!isAuthenticated) return '';
      
      if (currentPath.startsWith('/exam-taking/')) {
        const sessionId = currentPath.split('/').pop();
        if (sessionId) {
          const urlParams = new URLSearchParams(window.location.search);
          const examIdParam = urlParams.get('examId');
          
          if (examIdParam) {
            try {
              const decodedExamId = atob(examIdParam.padEnd(examIdParam.length + (4 - examIdParam.length % 4) % 4, '='));
              return `/ws/exam-room/${decodedExamId}`;
            } catch (error) {
              return `/ws/exam-room/${sessionId}`;
            }
          } else {
            return `/ws/exam-room/${sessionId}`;
          }
        }
      } else if (currentPath.startsWith('/monitor-exam/')) {
        const examId = currentPath.split('/').pop();
        if (examId) {
          return `/ws/exam-room/${examId}`;
        }
      }
      
      return '/ws/lobby';
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