import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, BookOpen, Calendar, Wifi, Menu } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { websocketService } from '../../services/websocketService';
import { DashboardStats, StudentCountByMajor, StudentGrowth, BrowserUsage, ActivityLog } from '../../types/dashboard';
import Sidebar from '../Sidebar';
import StudentsByMajorChart from '../charts/StudentsByMajorChart';
import StudentGrowthChart from '../charts/StudentGrowthChart';
import BrowserUsageChart from '../charts/BrowserUsageChart';
import ActivityFeed from '../ActivityFeed';

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [studentsByMajor, setStudentsByMajor] = useState<StudentCountByMajor[]>([]);
  const [studentGrowth, setStudentGrowth] = useState<StudentGrowth[]>([]);
  const [browserUsage, setBrowserUsage] = useState<BrowserUsage[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // Fetch all dashboard data
        const [
          statsData,
          majorData,
          growthData,
          browserData,
          activityData
        ] = await Promise.all([
          dashboardService.getDashboardStats(token),
          dashboardService.getStudentCountByMajor(token),
          dashboardService.getStudentGrowth(token),
          dashboardService.getBrowserUsage(token),
          dashboardService.getActivityLogs(token, 5)
        ]);

        setStats(statsData);
        setStudentsByMajor(majorData);
        setStudentGrowth(growthData);
        setBrowserUsage(browserData);
        setActivities(activityData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    // Setup WebSocket message handler for active users count
    const handleActiveUsersCount = (data: any) => {
      if (data.type === 'active_users_count' && typeof data.count === 'number') {
        setOnlineUsers(data.count);
      }
    };

    websocketService.onMessage('active_users_count', handleActiveUsersCount);

    return () => {
      websocketService.offMessage('active_users_count');
    };
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="hidden lg:block">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={false}
            onClose={closeSidebar}
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show dashboard content when dashboard menu is active
  if (activeMenu !== 'dashboard') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          activeMenu={activeMenu} 
          onMenuClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}
              </h2>
              <p className="text-gray-600">Halaman ini sedang dalam pengembangan</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Siswa', 
      value: stats?.total_students || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    { 
      title: 'Total Guru', 
      value: stats?.total_teachers || 0, 
      icon: BookOpen, 
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    { 
      title: 'User Online', 
      value: onlineUsers, 
      icon: Wifi, 
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    { 
      title: 'Total Kelas', 
      value: stats?.total_classes || 0, 
      icon: Calendar, 
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-3"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm lg:text-base text-gray-600">Selamat datang kembali, {user?.login_id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.login_id?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.login_id}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          {/* Main Content Grid - Chart dan Activity Feed berdampingan */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Bar Chart - 60% width */}
            <div className="lg:col-span-3">
              <StudentsByMajorChart data={studentsByMajor} />
            </div>
            
            {/* Activity Feed - 40% width */}
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} />
            </div>
          </div>

          {/* Secondary Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StudentGrowthChart data={studentGrowth} />
            <BrowserUsageChart data={browserUsage} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;