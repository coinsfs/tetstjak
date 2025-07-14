import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, BookOpen, Users, Calendar, CheckCircle } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const stats = [
    { title: 'Kelas Mengajar', value: '5', icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Total Siswa', value: '156', icon: Users, color: 'bg-green-500' },
    { title: 'Jadwal Hari Ini', value: '6', icon: Calendar, color: 'bg-purple-500' },
    { title: 'Tugas Dinilai', value: '23', icon: CheckCircle, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
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
        {user?.department_details && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
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

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Mengajar</h2>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Selamat datang di Teacher Dashboard. Kelola kelas dan siswa Anda dengan mudah.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;