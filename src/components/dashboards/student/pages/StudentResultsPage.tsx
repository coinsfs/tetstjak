import React, { useEffect, useState, useCallback } from 'react';
import { UserProfile } from '@/types/auth';
import { 
  BarChart3, TrendingUp, Award, FileText, ArrowLeft, Clock, Users, 
  Target, AlertTriangle, CheckCircle, XCircle, Timer, Brain,
  Eye, ShieldAlert, Zap, BookOpen, Calendar, User, GraduationCap
} from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  studentExamService, 
  StudentExam, 
  StudentExamFilters, 
  StudentAnalyticsResponse,
  ExamAnalytics
} from '@/services/studentExam';
import { ExamSessionAnalytics } from '@/types/exam';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import Pagination from '@/components/Pagination';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import ScoreDistributionChart from '@/components/charts/ScoreDistributionChart';
import toast from 'react-hot-toast';

interface StudentResultsPageProps {
  user: UserProfile | null;
}

const StudentResultsPage: React.FC<StudentResultsPageProps> = ({ user }) => {
  const { navigate, currentPath, currentFullUrl } = useRouter();
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalyticsResponse | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<ExamSessionAnalytics | null>(null);
  const [completedExams, setCompletedExams] = useState<StudentExam[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
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

  // URL parameter handling for specific session view
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session_id = urlParams.get('session_id');
    const exam_title = urlParams.get('exam_title');
    
    console.log('URL changed - Full URL:', currentFullUrl, { session_id, exam_title });
    
    if (session_id) {
      setSessionId(session_id);
      setExamTitle(exam_title ? decodeURIComponent(exam_title) : null);
      setActiveTab('overview');
      fetchSessionAnalytics(session_id);
    } else {
      // Reset when no session_id
      setSessionId(null);
      setExamTitle(null);
      setSessionAnalytics(null);
    }
  }, [currentFullUrl, token]); // Listen to full URL changes including query parameters

  const fetchSessionAnalytics = async (sessionId: string) => {
    if (!token) return;

    try {
      setLoadingSession(true);
      const sessionData = await studentExamService.getExamSessionAnalytics(token, sessionId);
      setSessionAnalytics(sessionData);
    } catch (error) {
      console.error('Error fetching session analytics:', error);
      toast.error('Gagal memuat analitik sesi ujian');
    } finally {
      setLoadingSession(false);
    }
  };

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleBackToExams = () => {
    navigate('/student/exams');
  };

  const handleBackToResults = () => {
    navigate('/student/results');
  };

  const handleViewExamDetails = (exam: StudentExam) => {
    if (exam.exam_session_id) {
      navigate(`/student/results?session_id=${exam.exam_session_id}&exam_title=${encodeURIComponent(exam.title)}`);
    } else {
      toast.error('Session ID tidak tersedia untuk ujian ini');
    }
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}j ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get specific exam analytics if viewing specific exam
  const specificExamAnalytics = sessionId 
    ? analytics?.exam_analytics.find(exam => exam.exam_id === sessionAnalytics?.exam_id)
    : null;

  const formatDateTime = (dateString: string) => {
    return formatDateTimeWithTimezone(dateString);
  };

  // If viewing detailed session analytics
  if (sessionId && sessionAnalytics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Analitik Detail: {sessionAnalytics.exam_title}
                </h2>
                <p className="text-gray-600">
                  Analisis komprehensif hasil ujian Anda
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/results')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </button>
          </div>
        </div>

        {/* Exam Info Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mata Pelajaran</p>
                <p className="font-semibold text-gray-900">{sessionAnalytics.subject_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Guru</p>
                <p className="font-semibold text-gray-900">{sessionAnalytics.teacher_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kelas</p>
                <p className="font-semibold text-gray-900">{sessionAnalytics.class_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tanggal</p>
                <p className="font-semibold text-gray-900">
                  {formatDateTime(sessionAnalytics.started_at).split(' ')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Skor Akhir</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(sessionAnalytics.performance_metrics.score)}`}>
                  {sessionAnalytics.performance_metrics.score.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  dari {sessionAnalytics.performance_metrics.max_possible_score}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Akurasi</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(sessionAnalytics.performance_metrics.accuracy_percentage)}`}>
                  {sessionAnalytics.performance_metrics.accuracy_percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {sessionAnalytics.performance_metrics.correct_answers} dari {sessionAnalytics.performance_metrics.total_questions} soal
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Waktu Pengerjaan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(sessionAnalytics.duration_taken)}
                </p>
                <p className="text-xs text-gray-500">
                  dari {formatDuration(sessionAnalytics.duration_allowed)}
                  {sessionAnalytics.is_overtime && (
                    <span className="text-red-500 ml-1">• Overtime</span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Peringkat Ujian</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{sessionAnalytics.class_comparison.student_rank}
                </p>
                <p className="text-xs text-gray-500">
                  dari {sessionAnalytics.class_comparison.total_participants} siswa
                  <span className="text-blue-600 ml-1">
                    • Persentil {sessionAnalytics.class_comparison.percentile}%
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Performa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Soal Dijawab</p>
                  <p className="text-xl font-bold text-gray-900">
                    {sessionAnalytics.performance_metrics.answered_questions}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jawaban Benar</p>
                  <p className="text-xl font-bold text-green-600">
                    {sessionAnalytics.performance_metrics.correct_answers}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jawaban Salah</p>
                  <p className="text-xl font-bold text-red-600">
                    {sessionAnalytics.performance_metrics.wrong_answers}
                  </p>
                </div>
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tidak Dijawab</p>
                  <p className="text-xl font-bold text-gray-600">
                    {sessionAnalytics.performance_metrics.unanswered_questions}
                  </p>
                </div>
                <Timer className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Class Comparison */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Perbandingan Kelas</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Skor Anda</span>
              <span className="text-lg font-bold text-blue-600">
                {sessionAnalytics.performance_metrics.score.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Rata-rata Kelas</span>
              <span className="text-lg font-bold text-gray-600">
                {sessionAnalytics.class_comparison.class_average_score.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Skor Tertinggi</span>
              <span className="text-lg font-bold text-green-600">
                {sessionAnalytics.class_comparison.class_highest_score.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Skor Terendah</span>
              <span className="text-lg font-bold text-red-600">
                {sessionAnalytics.class_comparison.class_lowest_score.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Questions Analysis */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Per Soal</h3>
          <div className="space-y-4">
            {sessionAnalytics.questions_analytics.map((question) => (
              <div key={question.question_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                        {question.displayed_position}
                      </span>
                      <div className="flex items-center space-x-2">
                        {question.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          question.is_correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {question.is_correct ? 'Benar' : 'Salah'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty === 'easy' ? 'Mudah' :
                         question.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{question.question_text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Jawaban Anda:</p>
                        <p className={`font-medium ${
                          question.is_correct ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {question.student_answer_text || 'Tidak dijawab'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Jawaban Benar:</p>
                        <p className="font-medium text-green-700">
                          {question.correct_answer_text || 'Tidak tersedia'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Poin</p>
                    <p className="text-lg font-bold text-gray-900">
                      {question.points_earned}/{question.points}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Analysis */}
        {sessionAnalytics.violation_analytics.total_violations > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Keamanan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Pelanggaran</p>
                    <p className="text-2xl font-bold text-red-600">
                      {sessionAnalytics.violation_analytics.total_violations}
                    </p>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Skor Fraud</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(sessionAnalytics.violation_analytics.fraud_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Level Risiko</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getRiskLevelColor(sessionAnalytics.violation_analytics.risk_level)}`}>
                      {sessionAnalytics.violation_analytics.risk_level}
                    </span>
                  </div>
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            {sessionAnalytics.violation_analytics.violation_timeline.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-base font-semibold text-gray-900 mb-3">Riwayat Pelanggaran</h5>
                <div className="space-y-3">
                  {sessionAnalytics.violation_analytics.violation_timeline.slice(0, 5).map((violation, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              violation.severity === 'low' ? 'bg-yellow-100 text-yellow-800' :
                              violation.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {violation.severity}
                            </span>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {violation.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{violation.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatDateTime(violation.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Behavioral Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Wawasan Perilaku</h3>
            </div>
            <div className="space-y-3">
              {sessionAnalytics.behavioral_insights.map((insight, index) => (
                <div key={index} className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-100">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Rekomendasi</h3>
            </div>
            <div className="space-y-3">
              {sessionAnalytics.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {sessionId && examTitle ? `Analitik: ${examTitle}` : 'Hasil Ujian'}
              </h2>
              <p className="text-gray-600">
                {sessionId ? 'Lihat hasil dan analisis performa ujian ini' : 'Lihat hasil dan analisis performa ujian Anda'}
              </p>
            </div>
          </div>
          {sessionId && (
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

      {/* Statistics Cards - Simplified */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-10"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Total Ujian</p>
                <p className="text-xl font-bold text-gray-900">{analytics.overall_stats.total_exams}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Rata-rata Anda</p>
                <p className="text-xl font-bold text-gray-900">
                  {specificExamAnalytics 
                    ? (specificExamAnalytics.student_score !== null ? Number(specificExamAnalytics.student_score).toFixed(1) : '0.0')
                    : Number(analytics.overall_stats.student_overall_average).toFixed(1)
                  }
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Award className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Rata-rata Kelas</p>
                <p className="text-xl font-bold text-gray-900">
                  {specificExamAnalytics 
                    ? Number(specificExamAnalytics.class_average).toFixed(1) 
                    : Number(analytics.overall_stats.class_overall_average).toFixed(1)
                  }
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {specificExamAnalytics ? 'Persentil Anda' : 'Tingkat Partisipasi'}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {specificExamAnalytics 
                    ? (specificExamAnalytics.student_percentile !== null ? `${Number(specificExamAnalytics.student_percentile).toFixed(1)}%` : '0.0%')
                    : `${Number(analytics.overall_stats.participation_rate).toFixed(1)}%`
                  }
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-50">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">-</p>
                  <p className="text-xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Charts - Consolidated */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Analisis Performa</h3>
          <div className="text-sm text-gray-500">
            Perbandingan nilai Anda dengan kelas
          </div>
        </div>
        
        {loadingAnalytics ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Memuat data analisis...</p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Trend Chart */}
            <div>
              <div className="flex items-center mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                <h4 className="text-sm font-semibold text-gray-900">Tren Performa</h4>
              </div>
              <PerformanceTrendChart 
                studentTrend={analytics.trend_data
                  .filter(item => item.student_score !== null)
                  .map(item => ({
                    exam_date: item.exam_date,
                    score: item.student_score || 0
                  }))}
                classTrend={analytics.trend_data.map(item => ({
                  exam_date: item.exam_date,
                  average_score: item.class_average
                }))}
              />
            </div>

            {/* Score Distribution Chart */}
            <div>
              <div className="flex items-center mb-4">
                <BarChart3 className="w-4 h-4 text-green-600 mr-2" />
                <h4 className="text-sm font-semibold text-gray-900">Distribusi Nilai</h4>
              </div>
              <ScoreDistributionChart 
                studentDistribution={specificExamAnalytics 
                  ? specificExamAnalytics.score_distribution.map(item => ({
                      range: item.range,
                      count: item.count,
                      percentage: item.percentage
                    }))
                  : analytics.exam_analytics.length > 0 
                    ? analytics.exam_analytics[0].score_distribution.map(item => ({
                        range: item.range,
                        count: item.count,
                        percentage: item.percentage
                      }))
                    : []
                }
                classDistribution={specificExamAnalytics 
                  ? specificExamAnalytics.score_distribution.map(item => ({
                      range: item.range,
                      count: item.count,
                      percentage: item.percentage
                    }))
                  : analytics.exam_analytics.length > 0 
                    ? analytics.exam_analytics[0].score_distribution.map(item => ({
                        range: item.range,
                        count: item.count,
                        percentage: item.percentage
                      }))
                    : []
                }
                studentHighestScore={specificExamAnalytics 
                  ? (specificExamAnalytics.student_score || 0)
                  : analytics.overall_stats.student_overall_average
                }
                classHighestScore={specificExamAnalytics 
                  ? specificExamAnalytics.class_highest
                  : analytics.overall_stats.class_overall_average
                }
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-medium text-gray-900 mb-2">Belum Ada Data Analisis</h4>
            <p className="text-gray-500 text-sm">
              Grafik analisis akan muncul setelah Anda menyelesaikan ujian.
            </p>
          </div>
        )}
      </div>

      {/* Completed Exams List */}
      {!sessionId && (
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
                      Nilai
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
                  {completedExams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                            {exam.exam_session_id && (
                              <div className="text-sm text-blue-600">
                                • Analitik tersedia
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {exam.status === 'completed' && exam.session_score !== undefined && exam.session_score !== null 
                              ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {exam.session_score.toFixed(1)}
                                  </span>
                                )
                              : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                                    Belum Ada
                                  </span>
                                )
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {getExamTypeLabel(exam.exam_type)}
                            </span>
                            {exam.status === 'completed' && exam.exam_session_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Selesai
                              </span>
                            )}
                          </div>
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
                          {exam.settings?.show_results_after_submission && exam.exam_session_id ? (
                            <button
                              onClick={() => handleViewExamDetails(exam)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Lihat Detail
                            </button>
                          ) : exam.status === 'completed' && !exam.settings?.show_results_after_submission ? (
                            <span className="text-gray-400">Hasil Belum Tersedia</span>
                          ) : exam.status === 'completed' && !exam.exam_session_id ? (
                            <span className="text-gray-400">Session Tidak Ditemukan</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Ujian Selesai</h4>
                <p className="text-gray-500 mb-4">
                  Ujian yang telah selesai akan muncul di sini dengan analitik detail.
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
      {sessionId && specificExamAnalytics && (
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
      {sessionId && !specificExamAnalytics && !loadingAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Analitik Belum Tersedia</h4>
              <p className="text-gray-500 mb-4">
                Analitik ujian sedang diproses. Silakan coba lagi nanti atau hubungi guru jika ada pertanyaan.
              </p>
              {sessionId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>ID Session:</strong> {sessionId.slice(-8)}
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