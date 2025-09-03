import React, { useEffect, useState, useCallback } from 'react';
import { UserProfile } from '@/types/auth';
import { BarChart3, TrendingUp, Award, FileText, ArrowLeft, Clock, Users, Target } from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  studentExamService, 
  StudentExam, 
  StudentExamFilters, 
  StudentAnalyticsResponse,
  ExamAnalytics 
} from '@/services/studentExam';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';

interface StudentResultsPageProps {
  user: UserProfile | null;
}

const StudentResultsPage: React.FC<StudentResultsPageProps> = ({ user }) => {
  const { navigate } = useRouter();
  const { token } = useAuth();
  const [examId, setExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalyticsResponse | null>(null);
  const [completedExams, setCompletedExams] = useState<StudentExam[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  const [filters, setFilters] = useState<StudentExamFilters>({
    academic_period_id: '',
    status: 'completed',
    page: 1,
    limit: 10
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Initialize with active academic period and fetch analytics
  useEffect(() => {
    const initializeData = async () => {
      if (!token) return;

      try {
        // Fetch analytics data
        setLoadingAnalytics(true);
        const analyticsData = await studentExamService.getStudentAnalytics(token);
        setAnalytics(analyticsData);

        // Get active academic period for completed exams
        const activePeriod = await studentExamService.getActiveAcademicPeriod(token);
        if (activePeriod) {
          setFilters(prev => ({
            ...prev,
            academic_period_id: activePeriod._id
          }));
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Gagal memuat data analitik');
      } finally {
        setLoadingAnalytics(false);
      }
    };

    initializeData();
  }, [token]);

  // Fetch completed exams when filters change
  const fetchCompletedExams = useCallback(async () => {
    if (!token || !filters.academic_period_id) return;

    try {
      setLoadingExams(true);
      const response = await studentExamService.getStudentExams(token, filters);
      setCompletedExams(response.data);
      setTotalItems(response.total_items);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Error fetching completed exams:', error);
      toast.error('Gagal memuat data ujian selesai');
    } finally {
      setLoadingExams(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchCompletedExams();
  }, [fetchCompletedExams]);

  // URL parameter handling for specific exam view
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const exam_id = urlParams.get('exam_id');
    const exam_title = urlParams.get('exam_title');
    
    if (exam_id) {
      setExamId(exam_id);
      setExamTitle(exam_title ? decodeURIComponent(exam_title) : null);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleBackToExams = () => {
    navigate('/student/exams');
  };

  const handleViewExamDetails = (exam: StudentExam) => {
    navigate(`/student/results?exam_id=${exam._id}&exam_title=${encodeURIComponent(exam.title)}`);
  };

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

  // Get specific exam analytics if viewing specific exam
  const specificExamAnalytics = examId 
    ? analytics?.exam_analytics.find(exam => exam.exam_id === examId)
    : null;
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {examId && examTitle ? `Analitik: ${examTitle}` : 'Hasil Ujian'}
              </h2>
              <p className="text-gray-600">
                {examId ? 'Lihat hasil dan analisis performa ujian ini' : 'Lihat hasil dan analisis performa ujian Anda'}
              </p>
            </div>
          </div>
          {examId && (
            <button
              onClick={handleBackToExams}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Ujian
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Ujian</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overall_stats.total_exams}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rata-rata Nilai</p>
                <p className="text-2xl font-bold text-gray-900">
                  {specificExamAnalytics ? specificExamAnalytics.student_score : analytics.overall_stats.student_overall_average}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {specificExamAnalytics ? 'Nilai Ujian' : 'Rata-rata Kelas'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {specificExamAnalytics ? specificExamAnalytics.class_average : analytics.overall_stats.class_overall_average}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {specificExamAnalytics ? 'Persentil' : 'Tingkat Partisipasi'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {specificExamAnalytics ? `${specificExamAnalytics.student_percentile}%` : `${analytics.overall_stats.participation_rate}%`}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                {specificExamAnalytics ? (
                  <Target className="w-6 h-6 text-orange-600" />
                ) : (
                  <Users className="w-6 h-6 text-orange-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">-</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Performa</h3>
        {loadingAnalytics ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Memuat data performa...</p>
          </div>
        ) : analytics?.trend_data && analytics.trend_data.length > 0 ? (
          <div className="space-y-4">
            {/* Simple trend visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Tren Nilai</h4>
                <div className="space-y-3">
                  {analytics.trend_data.slice(0, 5).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{trend.exam_title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(trend.exam_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{trend.student_score}</p>
                        <p className="text-xs text-gray-500">Kelas: {trend.class_average}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {specificExamAnalytics && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Distribusi Nilai Kelas</h4>
                  <div className="space-y-2">
                    {specificExamAnalytics.score_distribution.map((dist, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dist.range}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${dist.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {dist.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h4>
            <p className="text-gray-500 mb-4">
              Grafik performa akan muncul setelah Anda menyelesaikan ujian.
            </p>
          </div>
        )}
      </div>

      {/* Completed Exams List */}
      {!examId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Ujian Selesai</h3>
            <p className="text-sm text-gray-600 mt-1">Semua ujian yang telah Anda selesaikan</p>
          </div>
          
          <div className="overflow-x-auto">
            {loadingExams ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Memuat daftar ujian...</p>
              </div>
            ) : completedExams.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedExams.map((exam) => {
                    const examAnalytics = analytics?.exam_analytics.find(a => a.exam_id === exam._id);
                    return (
                      <tr key={exam._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                            {examAnalytics && (
                              <div className="text-sm text-gray-500">Nilai: {examAnalytics.student_score}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {exam.teaching_assignment_details?.subject_details?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {getExamTypeLabel(exam.exam_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(exam.availability_start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {exam.duration_minutes} menit
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {exam.settings?.show_results_after_submission ? (
                            <button
                              onClick={() => handleViewExamDetails(exam)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Lihat Detail
                            </button>
                          ) : (
                            <span className="text-gray-400">Hasil Belum Tersedia</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Ujian Selesai</h4>
                <p className="text-gray-500 mb-4">
                  Ujian yang telah selesai akan muncul di sini.
                </p>
                <button
                  onClick={() => navigate('/student/exams')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Lihat Ujian Tersedia
                </button>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {completedExams.length > 0 && (
            <Pagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              totalRecords={totalItems}
              recordsPerPage={filters.limit || 10}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}
        </div>
      )}

      {/* Specific Exam Analytics */}
      {examId && specificExamAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detail Analitik Ujian</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Informasi Ujian</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mata Pelajaran:</span>
                    <span className="text-sm font-medium text-gray-900">{specificExamAnalytics.subject_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tanggal Ujian:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(specificExamAnalytics.exam_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Peserta:</span>
                    <span className="text-sm font-medium text-gray-900">{specificExamAnalytics.total_participants} siswa</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Perbandingan Nilai</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nilai Anda:</span>
                    <span className="text-sm font-bold text-blue-600">{specificExamAnalytics.student_score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rata-rata Kelas:</span>
                    <span className="text-sm font-medium text-gray-900">{specificExamAnalytics.class_average}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nilai Tertinggi:</span>
                    <span className="text-sm font-medium text-green-600">{specificExamAnalytics.class_highest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nilai Terendah:</span>
                    <span className="text-sm font-medium text-red-600">{specificExamAnalytics.class_lowest}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No analytics available for specific exam */}
      {examId && !specificExamAnalytics && !loadingAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Analitik Belum Tersedia</h4>
              <p className="text-gray-500 mb-4">
                Analitik ujian sedang diproses. Silakan coba lagi nanti atau hubungi guru jika ada pertanyaan.
              </p>
              {examId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>ID Ujian:</strong> {examId.slice(-8)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;