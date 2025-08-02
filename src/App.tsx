import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
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
      
      // Handle root and login redirects
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
      } else {
        // Validate if current path is accessible for user role
        const isValidPath = validatePathForRole(currentPath, userRole);
        if (!isValidPath) {
          // Redirect to appropriate dashboard if path is not valid for role
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
      }
    } else if (!isAuthenticated && !isLoading) {
      // Redirect to login if not authenticated and not on login page
      if (currentPath !== '/login' && currentPath !== '/') {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, currentPath, navigate, isLoading]);

  // Function to validate if a path is accessible for a given role
  const validatePathForRole = (path: string, role: string): boolean => {
    const adminPaths = [
      '/admin',
      '/manage/teachers',
      '/manage/students', 
      '/manage/expertise-programs',
      '/manage/exams',
      '/manage/subjects',
      '/manage/classes',
      '/manage/assignments',
      '/manage/analytics'
    ];

    const teacherPaths = [
      '/teacher',
      '/teacher/classes',
      '/teacher/exams',
      '/teacher/questions',
      '/teacher/question-sets',
      '/teacher/analytics',
      '/teacher/profile'
    ];

    const studentPaths = [
      '/student'
    ];

    switch (role) {
      case 'admin':
        return adminPaths.some(adminPath => path.startsWith(adminPath));
      case 'teacher':
        return teacherPaths.some(teacherPath => path.startsWith(teacherPath));
      case 'student':
        return studentPaths.some(studentPath => path.startsWith(studentPath));
      default:
        return false;
    }
  };
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
    case '/manage/teachers':
    case '/manage/students':
    case '/manage/expertise-programs':
    case '/manage/exams':
    case '/manage/subjects':
    case '/manage/classes':
    case '/manage/assignments':
    case '/manage/analytics':
      return (
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      );
    case '/teacher':
    case '/teacher/classes':
    case '/teacher/exams':
    case '/teacher/questions':
    case '/teacher/question-sets':
    case '/teacher/analytics':
    case '/teacher/profile':
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
      // Handle unknown routes - redirect based on user role
      if (user) {
        const userRole = user.roles[0];
        switch (userRole) {
          case 'admin':
            navigate('/admin');
            return (
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            );
          case 'teacher':
            navigate('/teacher');
            return (
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            );
          case 'student':
            navigate('/student');
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