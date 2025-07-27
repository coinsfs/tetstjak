import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { getProfileImageUrl } from '@/constants/config';
import { Users, BookOpen, Calendar, Wifi, Menu, Activity, User } from 'lucide-react';
import { dashboardService } from '@/services/dashboard';
import { websocketService } from '@/services/websocket';
import { DashboardStats, StudentCountByMajor, StudentGrowth, BrowserUsage, ActivityLog } from '@/types/dashboard';
import { StudentPerformance } from '@/components/StudentPerformanceTable';
import Sidebar from '../Sidebar';
import StudentsByMajorChart from '../charts/StudentsByMajorChart';
import StudentGrowthChart from '../charts/StudentGrowthChart';
import BrowserUsageChart from '../charts/BrowserUsageChart';
import ActivityFeed from '../ActivityFeed';
import StudentPerformanceTable from '../StudentPerformanceTable';
import TeacherManagement from '../TeacherManagement';
import StudentManagement from '../StudentManagement';
import ExamManagement from '../ExamManagement';
import SubjectManagement from '../SubjectManagement';
import ClassManagement from '../ClassManagement';
import AssignmentManagement from '../AssignmentManagement';
import ExpertiseProgramManagement from '../ExpertiseProgramManagement';
import ProfileManagement from '../ProfileManagement';

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [studentsByMajor, setStudentsByMajor] = useState<StudentCountByMajor[]>([]);
  const [studentGrowth, setStudentGrowth] = useState<StudentGrowth[]>([]);
  const [browserUsage, setBrowserUsage] = useState<BrowserUsage[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Get active menu from current path
  const getActiveMenuFromPath = (path: string) => {
    if (path === '/' || path === '/admin') return 'dashboard';
    if (path === '/manage/teachers') return 'teachers';
    if (path === '/manage/students') return 'students';
    if (path === '/manage/expertise-programs') return 'expertise-programs';
    if (path === '/manage/exams') return 'exams';
    if (path === '/manage/subjects') return 'subjects';
    if (path === '/manage/classes') return 'classes';
    if (path === '/manage/assignments') return 'assignments';
    if (path === '/manage/analytics') return 'analytics';
    if (path === '/profile') return 'profile';
    return 'dashboard';
  };

  const activeMenu = getActiveMenuFromPath(currentPath);

  // Handle new activity from WebSocket
  const handleNewActivity = (newActivity: ActivityLog) => {
    setActivities(prevActivities => {
      // Remove the oldest activity and add the new one at the beginning
      const updatedActivities = [newActivity, ...prevActivities.slice(0, 4)];
      return updatedActivities;
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        const [
          statsData,
          majorData,
          growthData,
          browserData,
          activityData,
          performanceData
        ] = await Promise.all([
          dashboardService.getDashboardStats(token),
          dashboardService.getStudentCountByMajor(token),
          dashboardService.getStudentGrowth(token),
          dashboardService.getBrowserUsage(token),
          dashboardService.getActivityLogs(token, 5),
          dashboardService.getStudentPerformanceRoster(token, 5)
        ]);

        setStats(statsData);
        setStudentsByMajor(majorData);
        setStudentGrowth(growthData);
        setBrowserUsage(browserData);
        setActivities(activityData);
        setStudentPerformance(performanceData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    const handleActiveUsersCount = (data: any) => {
      if (data.type === 'active_users_count' && typeof data.count === 'number') {
        setOnlineUsers(data.count);
      }
    };

    const handleNewActivityLog = (data: any) => {
      if (data.type === 'new_activity_log' && data.data) {
        // Transform WebSocket data to match ActivityLog interface
        const newActivity: ActivityLog = {
          _id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_data: {
            user_id: data.data.user_id || 'unknown',
            full_name: data.data.full_name,
            user_roles: ['student'] // Default role, could be enhanced
          },
          activity: 'login',
          description: data.data.description,
          ip_address: '0.0.0.0', // Not provided in WebSocket data
          device_info: {
            device_type: 'desktop', // Default, could be enhanced
            os_name: 'Unknown OS',
            os_version: 'Unknown',
            browser_name: data.data.browser_name,
            browser_version: 'Unknown',
            user_agent: 'Unknown'
          },
          status: 'success',
          details: {
            method: 'POST',
            endpoint: '/auth/login'
          },
          created_at: data.data.timestamp
        };
        
        handleNewActivity(newActivity);
      }
    };
    websocketService.onMessage('active_users_count', handleActiveUsersCount);
    websocketService.onMessage('new_activity_log', handleNewActivityLog);

    return () => {
      websocketService.offMessage('active_users_count');
      websocketService.offMessage('new_activity_log');
    };
  }, []);

  const handleMenuClick = (menu: string) => {
    const pathMap: { [key: string]: string } = {
      'dashboard': '/admin',
      'teachers': '/manage/teachers',
      'students': '/manage/students',
      'expertise-programs': '/manage/expertise-programs',
      'exams': '/manage/exams',
      'subjects': '/manage/subjects',
      'classes': '/manage/classes',
      'assignments': '/manage/assignments',
      'analytics': '/manage/analytics',
      'profile': '/profile',
    };
    
    const path = pathMap[menu] || '/admin';
    navigate(path);
  };

  const handleViewStudentProfile = (studentId: string) => {
    console.log('View profile for student:', studentId);
    // TODO: Implement navigation to student profile page
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
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-700">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu !== 'dashboard') {
    if (activeMenu === 'teachers') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <TeacherManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'students') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <StudentManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'expertise-programs') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <ExpertiseProgramManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'exams') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <ExamManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'subjects') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <SubjectManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'classes') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <ClassManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'assignments') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <AssignmentManagement />
            </div>
          </div>
        </div>
      );
    }
    
    if (activeMenu === 'profile') {
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <ProfileManagement />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar 
          activeMenu={activeMenu} 
          onMenuClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}
              </h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Students', 
      value: stats?.total_students || 0, 
      icon: Users, 
      change: '+12%',
      positive: true
    },
    { 
      title: 'Teachers', 
      value: stats?.total_teachers || 0, 
      icon: BookOpen, 
      change: '+3%',
      positive: true
    },
    { 
      title: 'Online Now', 
      value: onlineUsers, 
      icon: Wifi, 
      change: 'Live',
      positive: true
    },
    { 
      title: 'Classes', 
      value: stats?.total_classes || 0, 
      icon: Calendar, 
      change: '+5%',
      positive: true
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      
      <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.login_id}</p>
              </div>
            </div>
            
            {/* User Profile Section */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                  {user?.profile_details?.full_name || user?.login_id}
                </p>
                {user?.department_details && (
                  <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">
                    <span className="hidden lg:inline">
                      {user.department_details.name}
                    </span>
                    <span className="lg:hidden">
                      {user.department_details.abbreviation}
                    </span>
                  </p>
                )}
              </div>
              
              {/* Profile Picture */}
              <div className="relative flex-shrink-0">
                {user?.profile_details?.profile_picture_url ? (
                  <img
                    src={getProfileImageUrl(user.profile_details.profile_picture_url) || user.profile_details.profile_picture_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Fallback Avatar */}
                <div 
                  className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-gray-200 shadow-sm ${
                    user?.profile_details?.profile_picture_url ? 'hidden' : 'flex'
                  }`}
                >
                  <span className="text-white font-semibold text-sm">
                    {user?.profile_details?.full_name 
                      ? user.profile_details.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : user?.login_id?.substring(0, 2).toUpperCase() || 'U'
                    }
                  </span>
                </div>
                
                {/* Online Status Indicator */}
                {user?.is_active && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-5 h-5 text-gray-400" />
                    <span className={`text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{stat.title}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              {/* Primary Chart */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Student Distribution</h3>
                        <p className="text-sm text-gray-500 mt-0.5">By major and grade level</p>
                      </div>
                      <Activity className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-5 flex-1 min-h-0">
                    <StudentsByMajorChart data={studentsByMajor} />
                  </div>
                </div>
              </div>
              
              {/* Activity Feed */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
                  <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
                        <p className="text-sm text-gray-500 mt-0.5">User logins and actions</p>
                      </div>
                      <Activity className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="p-5 flex-1 min-h-0">
                    <ActivityFeed activities={activities} onNewActivity={handleNewActivity} />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Student Growth</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Year over year trends</p>
                </div>
                <div className="p-5">
                  <StudentGrowthChart data={studentGrowth} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Browser Usage</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Platform distribution</p>
                </div>
                <div className="p-5">
                  <BrowserUsageChart data={browserUsage} />
                </div>
              </div>
            </div>

            
            {/* Student Performance Table */}
            <div className="mt-4">
              <StudentPerformanceTable 
                data={studentPerformance} 
                onViewProfile={handleViewStudentProfile}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;