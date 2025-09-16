import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/dashboards/AdminDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import StudentExamTakingPage from './components/dashboards/student/pages/StudentExamTakingPage';
import ProctorMonitoringPage from './components/dashboards/teacher/pages/ProctorMonitoringPage';
import ProtectedRoute from './components/ProtectedRoute';
import AnalyticsDashboard from './components/dashboards/admin/AnalyticsDashboard';
import AdminExportPage from './components/dashboards/admin/AdminExportPage';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Helper function to extract clean path without query parameters
  const getCleanPath = (path: string): string => {
    return path.split('?')[0];
  };

  // Helper function to extract ID from path
  const extractIdFromPath = (path: string): string | null => {
    const cleanPath = getCleanPath(path);
    const segments = cleanPath.split('/').filter(segment => segment.length > 0);
    return segments.length > 0 ? segments[segments.length - 1] : null;
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.roles[0];
      const cleanPath = getCleanPath(currentPath);
      
      // Handle root and login redirects
      if (cleanPath === '/' || cleanPath === '/login') {
        switch (userRole) {
          case 'admin':
            navigate('/admin');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/login');
        }
      }
    } else if (!isAuthenticated && !isLoading) {
      const cleanPath = getCleanPath(currentPath);
      // Redirect to login if not authenticated and not on login page
      if (cleanPath !== '/login' && cleanPath !== '/') {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, currentPath, navigate, isLoading]);

  // Force re-render when currentPath changes to ensure proper navigation
  useEffect(() => {
    console.log('Current path changed to:', currentPath);
  }, [currentPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const cleanPath = getCleanPath(currentPath);

  // Handle student exam-taking route
  if (cleanPath.startsWith('/exam-taking/')) {
    const sessionId = extractIdFromPath(cleanPath);
    if (sessionId) {
      console.log('Exam taking route detected, sessionId:', sessionId);
      return (
        <ProtectedRoute requiredRole="student">
          <StudentExamTakingPage user={user} sessionId={sessionId} />
        </ProtectedRoute>
      );
    }
  }

  // Handle proctor monitoring route
  if (cleanPath.startsWith('/monitor-exam/')) {
    const examId = extractIdFromPath(cleanPath);
    if (examId) {
      console.log('Monitor exam route detected, examId:', examId);
      return (
        <ProtectedRoute requiredRole="teacher">
          <ProctorMonitoringPage examId={examId} />
        </ProtectedRoute>
      );
    }
  }

  // Handle admin export configuration route
  if (cleanPath === '/manage/exports/configure') {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminExportPage />
      </ProtectedRoute>
    );
  }

  // Handle admin analytics dashboard route
  if (cleanPath === '/admin/analytics') {
    return (
      <ProtectedRoute requiredRole="admin">
        <AnalyticsDashboard />
      </ProtectedRoute>
    );
  }

  // Route based on current path
  if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/manage/')) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    );
  } else if (cleanPath.startsWith('/profile')) {
      // Handle profile route - determine which dashboard to render based on user role
      const userRole = user?.roles[0];
      
      if (userRole === 'admin') {
        return (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        );
      } else if (userRole === 'teacher') {
        return (
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        );
      } else if (userRole === 'student') {
        return (
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        );
      }
  } else if (cleanPath.startsWith('/teacher')) {
    return (
      <ProtectedRoute requiredRole="teacher">
        <TeacherDashboard />
      </ProtectedRoute>
    );
  } else if (cleanPath.startsWith('/student')) {
    return (
      <ProtectedRoute requiredRole="student">
        <StudentDashboard />
      </ProtectedRoute>
    );
  } else {
    // Handle unknown routes
    if (user) {
      const userRole = user.roles[0];
      
      switch (userRole) {
        case 'admin':
            // Remove automatic redirect for unknown routes to prevent conflicts
            // setTimeout(() => navigate('/admin'), 0);
          setTimeout(() => navigate('/admin'), 0);
          return (
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          );
        case 'teacher':
          setTimeout(() => navigate('/teacher'), 0);
          return (
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          );
        case 'student':
          setTimeout(() => navigate('/student'), 0);
          return (
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          );
        default:
          return <LoginForm />;
      }
    }
    return <LoginForm />;
  }
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;