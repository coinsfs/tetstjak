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

  // Helper function to extract clean path without query parameters
  const getCleanPath = (path: string): string => {
    return path.split('?')[0]; // Remove query parameters
  };

  // Helper function to extract ID from path
  const extractIdFromPath = (path: string): string | null => {
    const cleanPath = getCleanPath(path);
    const segments = cleanPath.split('/').filter(segment => segment.length > 0);
    return segments.length > 0 ? segments[segments.length - 1] : null;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      if (savedToken) {
        try {
          const userProfile = await authService.getUserProfile(savedToken);
          setUser(userProfile);
          setToken(savedToken);
          
          // Set user info for WebSocket heartbeat with proper checks
          const userRole = userProfile.user_roles && userProfile.user_roles.length > 0 ? userProfile.user_roles[0] : 'user';
          websocketService.setUserInfo(userProfile._id, userRole);
        } catch (error) {
          localStorage.removeItem('access_token');
          console.error('Failed to initialize auth:', error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Helper function to get current desired endpoint
  const getCurrentDesiredEndpoint = (): string => {
    if (!isAuthenticated) return '';
    
    const cleanPath = getCleanPath(currentPath);
    console.log('🔍 AuthContext - getCurrentDesiredEndpoint - cleanPath:', cleanPath);
    
    if (cleanPath.startsWith('/exam-taking/')) {
      const sessionId = extractIdFromPath(cleanPath);
      console.log('🔍 AuthContext - exam-taking route - sessionId:', sessionId);
      if (sessionId) {
        // Extract examId from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const examIdParam = urlParams.get('examId');
        console.log('🔍 AuthContext - examIdParam from URL:', examIdParam);
        
        if (examIdParam) {
          try {
            const decodedExamId = atob(examIdParam + '='.repeat((4 - examIdParam.length % 4) % 4));
            console.log('🔍 AuthContext - decodedExamId:', decodedExamId);
            return `/ws/exam-room/${decodedExamId}`;
          } catch (error) {
            console.warn('Failed to decode examId, using sessionId:', error);
            return `/ws/exam-room/${sessionId}`;
          }
        } else {
          console.log('🔍 AuthContext - no examIdParam, using sessionId for endpoint');
          return `/ws/exam-room/${sessionId}`;
        }
      }
    } else if (cleanPath.startsWith('/monitor-exam/')) {
      const examId = extractIdFromPath(cleanPath);
      console.log('🔍 AuthContext - monitor-exam route - examId:', examId);
      if (examId) {
        console.log('Monitor exam detected, examId:', examId); // Debug log
        const endpoint = `/ws/exam-room/${examId}`;
        console.log('🔍 AuthContext - monitor-exam endpoint:', endpoint);
        return endpoint;
      }
    }
    
    console.log('🔍 AuthContext - default endpoint: /ws/lobby');
    return '/ws/lobby';
  };

  // Centralized WebSocket connection management
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && token && user) {
        // Set user info for WebSocket heartbeat with proper checks
        const userRole = user.user_roles && user.user_roles.length > 0 ? user.user_roles[0] : 'user';
        websocketService.setUserInfo(user._id, userRole);
        
        // Determine the correct WebSocket endpoint based on current path
        const desiredEndpoint = getCurrentDesiredEndpoint();
        
        console.log('Current path:', currentPath); // Debug log
        console.log('Clean path:', getCleanPath(currentPath)); // Debug log
        console.log('🔍 AuthContext - Desired endpoint:', desiredEndpoint); // Debug log
        
        // Add defensive logging and validation
        console.log('🔍 AuthContext - About to call websocketService.connect with endpoint:', desiredEndpoint);
        
        // Defensive check: ensure endpoint has proper prefix
        let validatedEndpoint = desiredEndpoint;
        if (!desiredEndpoint.startsWith('/ws/')) {
          console.warn('🚨 AuthContext - Invalid endpoint detected, fixing:', desiredEndpoint);
          if (desiredEndpoint.length === 24) { // Looks like a MongoDB ObjectId
            validatedEndpoint = `/ws/exam-room/${desiredEndpoint}`;
          } else {
            validatedEndpoint = '/ws/lobby';
          }
          console.log('🔍 AuthContext - Corrected endpoint to:', validatedEndpoint);
        }
        
        // Get current WebSocket endpoint
        const currentEndpoint = websocketService.getCurrentEndpoint();
        const isConnected = websocketService.isConnected();
        const connectionState = websocketService.getConnectionState();
        
        console.log('🔍 AuthContext - Current WebSocket state:', {
          currentEndpoint,
          desiredEndpoint,
          isConnected,
          connectionState
        });
        
        // Only connect if endpoint is different, no connection exists, or connection is broken
        const shouldConnect = currentEndpoint !== validatedEndpoint || 
                             !isConnected || 
                             (connectionState.readyState !== undefined && 
                              connectionState.readyState !== WebSocket.OPEN && 
                              !connectionState.isReconnecting);
        
        if (shouldConnect) {
          console.log('🔍 AuthContext - WebSocket connection needed, calling websocketService.connect with:', desiredEndpoint);
          console.log('🔍 AuthContext - Final validated endpoint being sent:', validatedEndpoint);
          console.log('WebSocket connection needed:', {
            currentEndpoint,
            desiredEndpoint: validatedEndpoint,
            isConnected,
            shouldConnect
          }); // Debug log
          
          // Disconnect existing connection cleanly
          if (currentEndpoint && isConnected) {
            websocketService.disconnect();
          }
          
          // Connect immediately - no setTimeout wrapper needed
          const onAuthError = () => {
            console.error('WebSocket auth error');
            logout();
          };

          const onStatusChange = (status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => {
            console.log('WebSocket status changed:', status); // Debug log
            // Handle reconnection logic more carefully
            if (status === 'disconnected' || status === 'error') {
              // Only attempt reconnection if we're still on the same path and authenticated
              const currentDesiredEndpoint = getCurrentDesiredEndpoint();
              if (currentDesiredEndpoint === desiredEndpoint && isAuthenticated && token) {
                console.log('Will attempt reconnection if needed'); // Debug log
              }
            }
          };

          websocketService.connect(token, validatedEndpoint, onAuthError, onStatusChange);
        }
      } else {
        // User is not authenticated, disconnect WebSocket
        websocketService.disconnect();
      }
    }
  }, [isAuthenticated, token, isLoading, currentPath, user]);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await authService.login(username, password);
      const userProfile = await authService.getUserProfile(response.access_token);
      
      setToken(response.access_token);
      setUser(userProfile);
      localStorage.setItem('access_token', response.access_token);
      
      // Set user info for WebSocket heartbeat with proper checks
      const userRole = userProfile.user_roles && userProfile.user_roles.length > 0 ? userProfile.user_roles[0] : 'user';
      websocketService.setUserInfo(userProfile._id, userRole);
      
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
      
      // Update user info for WebSocket heartbeat with proper checks
      const userRole = userProfile.user_roles && userProfile.user_roles.length > 0 ? userProfile.user_roles[0] : 'user';
      websocketService.setUserInfo(userProfile._id, userRole);
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