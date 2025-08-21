import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { Loader } from 'lucide-react';
import { dashboardService } from '@/services/dashboard';
import { TeacherDashboardStats } from '@/types/dashboard';
import TeacherSidebar from './teacher/TeacherSidebar';
import TeacherHeader from './teacher/TeacherHeader';
import TeacherMainContent from './teacher/TeacherMainContent';
import toast from 'react-hot-toast';
import ProctorMonitoringPage from './teacher/pages/ProctorMonitoringPage';

const TeacherDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<TeacherDashboardStats | undefined>();
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Add loading state check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle monitoring route first
  if (currentPath.startsWith('/monitor-exam/')) {
    const examId = currentPath.split('/').pop();
    if (examId) {
      return <ProctorMonitoringPage examId={examId} />;
    }
  }

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) return;

      try {
        setStatsLoading(true);
        const stats = await dashboardService.getTeacherDashboardStats(token);
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching teacher dashboard stats:', error);
        toast.error('Gagal memuat statistik dashboard');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

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

  const renderContent = () => {
    switch (currentPath) {
      case '/teacher':
      case '/teacher/':
        return <TeacherDashboardPage />;
      case '/teacher/classes':
        return <TeacherClassesPage />;
      case '/teacher/exams':
        return <TeacherExamsPage />;
      case '/teacher/questions':
        return <TeacherQuestionsPage />;
      case '/teacher/question-sets':
        return <TeacherQuestionSetsPage />;
      case '/teacher/analytics':
        return <TeacherAnalyticsPage />;
      case '/teacher/profile':
        return <TeacherProfilePage />;
      default:
        return <TeacherDashboardPage />;
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
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        {/* Header Component */}
        <TeacherMainContent>
          {renderContent()}
        </TeacherMainContent>
          user={user}
          setSidebarOpen={setSidebarOpen}
          title={getPageTitle()}
        />

        {/* Main Content Component */}
        <TeacherMainContent
          user={user}
          currentPath={currentPath}
          dashboardStats={dashboardStats}
          statsLoading={statsLoading}
        />
      </div>
    </div>
  );
};
};

export default TeacherDashboard;