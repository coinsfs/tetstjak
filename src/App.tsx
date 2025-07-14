import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRouter } from './hooks/useRouter';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/dashboards/AdminDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.roles[0];
      
      // Redirect based on role if user is on login page or root
      if (currentPath === '/' || currentPath === '/login') {
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
      // Redirect to login if not authenticated and not on login page
      if (currentPath !== '/login' && currentPath !== '/') {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, currentPath, navigate, isLoading]);

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

  // Route based on current path
  switch (currentPath) {
    case '/admin':
      return (
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      );
    case '/teacher':
      return (
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      );
    case '/student':
      return (
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      );
    default:
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