import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import TeacherSidebar from './teacher/TeacherSidebar';
import TeacherHeader from './teacher/TeacherHeader';
import TeacherMainContent from './teacher/TeacherMainContent';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = () => {
    switch (currentPath) {
      case '/teacher':
        return 'Dashboard';
      case '/teacher/classes':
        return 'Manajemen Kelas';
      case '/teacher/exams':
        return 'Manajemen Ujian';
      case '/teacher/questions':
        return 'Bank Soal';
      case '/teacher/analytics':
        return 'Analitik';
      case '/teacher/profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Component */}
      <TeacherSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPath={currentPath}
        navigate={navigate}
        logout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header Component */}
        <TeacherHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          title={getPageTitle()}
        />

        {/* Main Content Component */}
        <TeacherMainContent
          user={user}
          currentPath={currentPath}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;