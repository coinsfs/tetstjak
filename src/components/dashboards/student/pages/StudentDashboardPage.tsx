import React from 'react';
import { UserProfile } from '@/types/auth';
import { BookOpen, Clock, TrendingUp, Award } from 'lucide-react';

interface StudentDashboardPageProps {
  user: UserProfile | null;
}

const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ user }) => {
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const statsCards = [
    {
      title: 'Ujian Tersedia',
      value: '0',
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Ujian Selesai',
      value: '0',
      icon: Award,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Rata-rata Nilai',
      value: '0',
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Waktu Belajar',
      value: '0 jam',
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getWelcomeMessage()}, {user?.profile_details?.full_name || user?.login_id}!
            </h1>
            <p className="text-blue-100">
              Selamat datang di dashboard siswa. Mari mulai belajar hari ini!
            </p>
            {user?.class_details && (
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-500 bg-opacity-50 text-sm">
                Kelas: {user.class_details.name} - {user.class_details.expertise_details?.name}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <BookOpen className="w-16 h-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ujian Mendatang</h3>
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada ujian yang dijadwalkan</p>
            <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hasil Terbaru</h3>
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada hasil ujian</p>
            <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Study Progress */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Belajar</h3>
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Fitur progress belajar akan segera hadir</p>
          <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;