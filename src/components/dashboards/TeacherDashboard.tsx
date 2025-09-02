import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { dashboardService } from '@/services/dashboard';
import { TeacherDashboardStats } from '@/types/dashboard';
import TeacherSidebar from './teacher/TeacherSidebar';
import TeacherHeader from './teacher/TeacherHeader';
import TeacherMainContent from './teacher/TeacherMainContent';
import TeacherActivityOverview from './teacher/TeacherActivityOverview';
import toast from 'react-hot-toast';

const TeacherDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { currentPath } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await dashboardService.getTeacherDashboardStats(token);
      setStats(response);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <TeacherSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={currentPath}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <TeacherHeader 
          user={user}
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <TeacherMainContent 
          user={user} 
          stats={stats} 
          loading={loading}
          currentPath={currentPath}
        >
          <div className="mt-6">
            <TeacherActivityOverview />
          </div>
        </TeacherMainContent>
      </div>
    </div>
  );
};

export default TeacherDashboard;