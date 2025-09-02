import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { dashboardService } from '@/services/dashboard';
import TeacherActivityOverview from './teacher/TeacherActivityOverview';
import TeacherSidebar from './teacher/TeacherSidebar';
import TeacherHeader from './teacher/TeacherHeader';
import TeacherMainContent from './teacher/TeacherMainContent';
import toast from 'react-hot-toast';

const TeacherDashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<TeacherDashboardStats | undefined>();
  const [statsLoading, setStatsLoading] = useState(true);

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
        // Handle sub-routes or unknown routes
        if (currentPath.startsWith('/teacher/')) {
          return 'Teacher Dashboard';
        }
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
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        {/* Header Component */}
        <TeacherHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          title={getPageTitle()}
        />

        {/* Main Content Component */}
      {/* Activity Overview */}
      <div className="mt-6">
          dashboardStats={dashboardStats}
      </div>
          statsLoading={statsLoading}
        >
          <TeacherActivityOverview />
        </div>
        </TeacherMainContent>
      </div>
    </div>
  );
};

export default TeacherDashboard;