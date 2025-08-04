import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/auth';
import { BookOpen, Clock, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentExamService, StudentExam } from '@/services/studentExam';
import toast from 'react-hot-toast';

interface StudentDashboardPageProps {
  user: UserProfile | null;
}

const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ user }) => {
  const { token } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<StudentExam[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  useEffect(() => {
    const fetchUpcomingExams = async () => {
      if (!token) return;

      try {
        setLoadingUpcoming(true);
        const activeAcademicPeriod = await studentExamService.getActiveAcademicPeriod(token);
        
        if (activeAcademicPeriod) {
          const response = await studentExamService.getStudentExams(token, {
            academic_period_id: activeAcademicPeriod._id,
            status: 'ready',
            limit: 5
          });
          setUpcomingExams(response.data);
        }
      } catch (error) {
        console.error('Error fetching upcoming exams:', error);
        toast.error('Gagal memuat ujian mendatang');
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingExams();
  }, [token]);

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
      value: upcomingExams.length.toString(),
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

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'official_uts': return 'UTS';
      case 'official_uas': return 'UAS';
      case 'quiz': return 'Kuis';
      case 'daily_test': return 'Ulangan Harian';
      default: return type;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          {loadingUpcoming ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Memuat ujian...</p>
            </div>
          ) : upcomingExams.length > 0 ? (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{exam.title}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {getExamTypeLabel(exam.exam_type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {exam.duration_minutes} menit
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(exam.availability_start_time)} - {formatDateTime(exam.availability_end_time)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Siap
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada ujian yang dijadwalkan</p>
            </div>
          )}
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