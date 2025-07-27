import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { 
  LogOut, 
  User, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Menu, 
  X,
  Home,
  Users,
  FileText,
  Database,
  BarChart3,
  Settings
} from 'lucide-react';
import { getProfileImageUrl } from '@/constants/config';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/teacher' },
    { id: 'classes', label: 'Kelas', icon: Users, path: '/teacher/classes' },
    { id: 'exams', label: 'Ujian', icon: FileText, path: '/teacher/exams' },
    { id: 'questions', label: 'Bank Soal', icon: Database, path: '/teacher/questions' },
    { id: 'analytics', label: 'Analitik', icon: BarChart3, path: '/teacher/analytics' },
  ];

  const bottomMenuItems = [
    { id: 'profile', label: 'Profile', icon: Settings, path: '/teacher/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, action: logout },
  ];

  const stats = [
    { title: 'Kelas Mengajar', value: '5', icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Total Siswa', value: '156', icon: Users, color: 'bg-green-500' },
    { title: 'Jadwal Hari Ini', value: '6', icon: Calendar, color: 'bg-purple-500' },
    { title: 'Tugas Dinilai', value: '23', icon: CheckCircle, color: 'bg-orange-500' },
  ];

  const handleMenuClick = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    setSidebarOpen(false);
  };

  const isActiveMenu = (path: string) => {
    if (path === '/teacher') {
      return currentPath === '/teacher';
    }
    return currentPath.startsWith(path);
  };

  const getProfileImage = () => {
    const profileUrl = user?.profile_details?.profile_picture_url;
    if (profileUrl) {
      const fullUrl = getProfileImageUrl(profileUrl);
      return fullUrl;
    }
    return null;
  };

  const getInitials = () => {
    const fullName = user?.profile_details?.full_name || user?.login_id || 'T';
    return fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Teacher</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveMenu(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Menu Items */}
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path ? isActiveMenu(item.path) : false;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : item.id === 'logout'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive 
                        ? 'text-green-600' 
                        : item.id === 'logout' 
                        ? 'text-red-500' 
                        : 'text-gray-400'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl font-semibold text-gray-900 lg:ml-0">
                Dashboard
              </h1>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile_details?.full_name || user?.login_id}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.department_details?.name || 'Teacher'}
                </p>
              </div>
              
              <div className="relative">
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()!}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200 ${getProfileImage() ? 'hidden' : ''}`}>
                  <span className="text-sm font-semibold text-green-700">
                    {getInitials()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Department Info */}
          {user?.department_details && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Jurusan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Jurusan</p>
                  <p className="text-lg font-medium text-gray-900">{user.department_details.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Singkatan</p>
                  <p className="text-lg font-medium text-gray-900">{user.department_details.abbreviation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Teaching Summary */}
          {user?.teaching_summary && user.teaching_summary.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mata Pelajaran yang Diampu</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.teaching_summary.map((teaching, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{teaching.subject_name}</p>
                        <p className="text-sm text-gray-600">{teaching.class_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Welcome Content */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Mengajar</h2>
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selamat datang, {user?.profile_details?.full_name || user?.login_id}!
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Kelola kelas dan siswa Anda dengan mudah. Gunakan menu di sidebar untuk mengakses berbagai fitur yang tersedia.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;