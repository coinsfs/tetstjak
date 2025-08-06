
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/dashboards/AdminDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import StudentExamTakingPage from './components/dashboards/student/pages/StudentExamTakingPage';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔄 App useEffect triggered:', { 
      isAuthenticated, 
      user: !!user, 
      currentPath, 
      isLoading,
      userRole: user?.roles[0] 
    });

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
        // ✅ PERBAIKAN: Skip validation untuk exam-taking paths
        if (currentPath.startsWith('/student/exam-taking/') && userRole === 'student') {
          console.log('✅ Allowing exam-taking path:', currentPath);
          return; // Skip validation untuk exam paths
        }
        
        // Validate if current path is accessible for user role
        const isValidPath = validatePathForRole(currentPath, userRole);
        if (!isValidPath) {
          console.log('❌ Invalid path for role:', { currentPath, userRole });
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
      '/student',
      '/student/exams',
      '/student/results',
      '/student/evaluation',
      '/student/profile'
    ];

    switch (role) {
      case 'admin':
        return adminPaths.some(adminPath => path.startsWith(adminPath));
      case 'teacher':
        return teacherPaths.some(teacherPath => path.startsWith(teacherPath));
      case 'student':
        // ✅ PERBAIKAN: Handle exam-taking paths secara khusus
        if (path.startsWith('/student/exam-taking/')) {
          return true; // Always allow exam-taking paths for students
        }
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

  // ✅ PERBAIKAN: Handle student exam-taking route dengan priority tinggi
  if (currentPath.startsWith('/student/exam-taking/')) {
    const sessionId = currentPath.split('/').pop();
    console.log('🎯 Rendering StudentExamTakingPage with sessionId:', sessionId);
    if (sessionId) {
      return (
        <ProtectedRoute requiredRole="student">
          <StudentExamTakingPage user={user} sessionId={sessionId} />
        </ProtectedRoute>
      );
    }
  }

  // Route based on current path
  // ✅ PERBAIKAN: Gunakan startsWith untuk routing yang lebih fleksibel
  if (currentPath.startsWith('/admin') || currentPath.startsWith('/manage/')) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith('/teacher')) {
    return (
      <ProtectedRoute requiredRole="teacher">
        <TeacherDashboard />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith('/student')) {
    return (
      <ProtectedRoute requiredRole="student">
        <StudentDashboard />
      </ProtectedRoute>
    );
  } else {
    // ✅ PERBAIKAN: Handle unknown routes dengan logic yang lebih aman
    if (user) {
      const userRole = user.roles[0];
      
      console.log('🔄 Unknown route, redirecting based on role:', { currentPath, userRole });
      switch (userRole) {
        case 'admin':
          setTimeout(() => navigate('/admin'), 0); // Async redirect
          return (
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          );
        case 'teacher':
          setTimeout(() => navigate('/teacher'), 0); // Async redirect
          return (
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          );
        case 'student':
          setTimeout(() => navigate('/student'), 0); // Async redirect
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
    case '/student/exams':
    case '/student/results':
    case '/student/evaluation':
    case '/student/profile':
      return (
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      );
    default:
      // ✅ PERBAIKAN: Handle unknown routes dengan logic yang lebih aman
      if (user) {
        const userRole = user.roles[0];
        
        // Double check untuk exam-taking paths (safety net)
        if (currentPath.startsWith('/student/exam-taking/') && userRole === 'student') {
          const sessionId = currentPath.split('/').pop();
          console.log('🎯 Safety net: Rendering StudentExamTakingPage with sessionId:', sessionId);
          if (sessionId) {
            return (
              <ProtectedRoute requiredRole="student">
                <StudentExamTakingPage user={user} sessionId={sessionId} />
              </ProtectedRoute>
            );
          }
        }
        
        // ✅ PERBAIKAN: Tidak langsung navigate, tapi render dashboard dulu
        console.log('🔄 Unknown route, redirecting based on role:', { currentPath, userRole });
        switch (userRole) {
          case 'admin':
            setTimeout(() => navigate('/admin'), 0); // Async redirect
            return (
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            );
          case 'teacher':
            setTimeout(() => navigate('/teacher'), 0); // Async redirect
            return (
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            );
          case 'student':
            setTimeout(() => navigate('/student'), 0); // Async redirect
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