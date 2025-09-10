import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/auth';
import { BookOpen, Clock, TrendingUp, Award, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { studentExamService, StudentExam } from '@/services/studentExam';
import { userService } from '@/services/user';
import { StudentStats } from '@/types/studentStats';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import toast from 'react-hot-toast';

interface StudentDashboardPageProps {
  user: UserProfile | null;
}

const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ user }) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [upcomingExams, setUpcomingExams] = useState<StudentExam[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<StudentExam[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoadingUpcoming(true);
        setLoadingResults(true);
        setLoadingStats(true);
        
        const activeAcademicPeriod = await studentExamService.getActiveAcademicPeriod(token);
        
        if (activeAcademicPeriod) {
          // Fetch upcoming exams (ongoing status)
          const upcomingResponse = await studentExamService.getStudentExams(token, {
            academic_period_id: activeAcademicPeriod._id,
            status: 'ongoing',
            limit: 5
          });
          setUpcomingExams(upcomingResponse.data);
          
          // Fetch recent completed exams
          const completedResponse = await studentExamService.getStudentExams(token, {
            academic_period_id: activeAcademicPeriod._id,
            status: 'completed',
            limit: 5
          });
          setRecentResults(completedResponse.data);
        }

        // Fetch student statistics
        try {
          const stats = await userService.getStudentStats(token);
          setStudentStats(stats);
        } catch (error) {
          console.error('Error fetching student stats:', error);
          // Don't show error toast for stats as it's not critical
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Gagal memuat data dashboard');
      } finally {
        setLoadingUpcoming(false);
        setLoadingResults(false);
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleStartExam = async (exam: StudentExam) => {
    // Redirect to dashboard home when exam is started
    navigate('/student');
    toast.success('Ujian dimulai! Anda akan diarahkan ke dashboard.');
  };

  const handleViewResult = (exam: StudentExam) => {
    // Navigate to results page with exam filter
    navigate(`/student/results?exam_id=${exam._id}&exam_title=${encodeURIComponent(exam.title)}`);
  };

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
      value: loadingUpcoming ? '...' : upcomingExams.length.toString(),
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Ujian',
      value: loadingStats ? '...' : (studentStats?.total_exams?.toString() || '0'),
      icon: Award,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Rata-rata Nilai',
      value: loadingStats ? '...' : (studentStats?.average_score ? studentStats.average_score.toFixed(1) : '0'),
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Nilai Tertinggi',
      value: loadingStats ? '...' : (studentStats?.highest_score ? studentStats.highest_score.toFixed(1) : '0'),
      icon: Target,
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
    return formatDateTimeWithTimezone(dateString);
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
                Kelas: {user.class_details.grade_level} - {user.class_details.expertise_details?.name}
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
            <div className="space-y-4">
              {upcomingExams.map((exam) => (
                <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getExamTypeLabel(exam.exam_type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {exam.duration_minutes} menit
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          exam.status === 'ready' ? 'bg-green-100 text-green-800' :
                          exam.status === 'active' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status === 'ready' ? 'Siap' : 
                           exam.status === 'active' ? 'Aktif' : 
                           exam.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p className="mb-1">
                          <span className="font-medium">Mulai:</span> {formatDateTime(exam.availability_start_time)}
                        </p>
                        <p>
                          <span className="font-medium">Selesai:</span> {formatDateTime(exam.availability_end_time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      {exam.status === 'ready' && (
                        <button 
                          onClick={() => handleStartExam(exam)}
                          disabled={startingExamId === exam._id}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {startingExamId === exam._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                              Memulai...
                            </>
                          ) : (
                            'Mulai Ujian'
                          )}
                        </button>
                      )}
                      {exam.status === 'ongoing' && (
                        <button 
                          onClick={() => handleStartExam(exam)}
                          disabled={startingExamId === exam._id}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {startingExamId === exam._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                              Memulai...
                            </>
                          ) : (
                            'Lanjutkan'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View All Button */}
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => navigate('/student/exams')}
                  className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                >
                  Lihat Semua Ujian →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada ujian yang dijadwalkan</p>
              <button 
                onClick={() => navigate('/student/exams')}
                className="mt-3 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm"
              >
                Cek Halaman Ujian
              </button>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hasil Terbaru</h3>
          {loadingResults ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Memuat hasil ujian...</p>
            </div>
          ) : recentResults.length > 0 ? (
            <div className="space-y-4">
              {recentResults.map((exam) => (
                <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {getExamTypeLabel(exam.exam_type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {exam.duration_minutes} menit
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Award className="w-3 h-3 mr-1" />
                          Selesai
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p className="mb-1">
                          <span className="font-medium">Periode:</span> {formatDateTime(exam.availability_start_time)} - {formatDateTime(exam.availability_end_time)}
                        </p>
                        {exam.teaching_assignment_details?.subject_details && (
                          <p>
                            <span className="font-medium">Mata Pelajaran:</span> {exam.teaching_assignment_details.subject_details.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      {exam.settings?.show_results_after_submission ? (
                        <button 
                          onClick={() => handleViewResult(exam)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Lihat Hasil
                        </button>
                      ) : (
                        <div className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-md text-center">
                          Hasil Belum Tersedia
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View All Button */}
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => navigate('/student/results')}
                  className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                >
                  Lihat Semua Hasil →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada hasil ujian</p>
              <button 
                onClick={() => navigate('/student/exams')}
                className="mt-3 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm"
              >
                Cek Ujian Tersedia
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Study Progress */}
      {/* <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Belajar</h3>
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Fitur progress belajar akan segera hadir</p>
          <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
        </div>
      </div> */}
    </div>
  );
};

export default StudentDashboardPage;