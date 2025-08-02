import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import StudentSidebar from './student/StudentSidebar';
import StudentHeader from './student/StudentHeader';
import StudentMainContent from './student/StudentMainContent';
import { LogOut, User, BookOpen, Calendar, Award } from 'lucide-react';

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

  const stats = [
    { title: 'Mata Pelajaran', value: '12', icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Tugas Pending', value: '3', icon: Calendar, color: 'bg-orange-500' },
    { title: 'Nilai Rata-rata', value: '87', icon: Award, color: 'bg-green-500' },
    { title: 'Kehadiran', value: '95%', icon: User, color: 'bg-purple-500' },
  ];

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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.login_id}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
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

        {/* Class Info */}
        {user?.class_details && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kelas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Kelas</p>
                <p className="text-lg font-medium text-gray-900">
                  {user.class_details.grade_level} - {user.class_details.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tahun Ajaran</p>
                <p className="text-lg font-medium text-gray-900">{user.class_details.academic_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Jurusan</p>
                <p className="text-lg font-medium text-gray-900">
                  {user.department_details?.abbreviation || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Pembelajaran</h2>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Selamat datang di Student Dashboard. Akses materi pembelajaran dan pantau progress Anda.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;