import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import StudentSidebar from './student/StudentSidebar';
import StudentHeader from './student/StudentHeader';
import StudentMainContent from './student/StudentMainContent';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = () => {
    switch (currentPath) {
      case '/student':
        return 'Dashboard';
      case '/student/exams':
        return 'Ujian';
      case '/student/results':
        return 'Hasil Ujian';
      case '/student/evaluation':
        return 'Evaluasi';
      case '/student/profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Component */}
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPath={currentPath}
        navigate={navigate}
        logout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        {/* Header Component */}
        <StudentHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          title={getPageTitle()}
        />

        {/* Main Content Component */}
        <StudentMainContent
          user={user}
          currentPath={currentPath}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;