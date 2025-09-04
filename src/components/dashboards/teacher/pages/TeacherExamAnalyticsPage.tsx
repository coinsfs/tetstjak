import React, { useState, useEffect } from 'react';
import { useRouter } from '@/hooks/useRouter';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  BookOpen,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  FileText,
  Award,
  Timer,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { teacherExamService } from '@/services/teacherExam';
import { TeacherExamAnalytics } from '@/types/teacherAnalytics';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const TeacherExamAnalyticsPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<TeacherExamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Extract examId from path
  const examId = currentPath.split('/').pop();

  useEffect(() => {
    if (!examId || !token) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await teacherExamService.getExamAnalytics(token, examId);
        setAnalytics(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal memuat data analitik';
        toast.error(errorMessage);
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [examId, token]);

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    if (!analytics) return;
    
    // Create download data based on format
    let data: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        data = JSON.stringify(analytics, null, 2);
        filename = `exam-analytics-${analytics.exam_metadata.exam_id}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        // Convert student performances to CSV
        const headers = ['Nama Siswa', 'Skor', 'Persentase', 'Peringkat', 'Grade', 'Durasi (menit)', 'Jawaban Benar', 'Jawaban Salah', 'Tidak Dijawab', 'Akurasi (%)', 'Pelanggaran'];
        const csvData = analytics.student_performances.map(student => [
          student.student_name,
          student.score,
          student.percentage,
          student.rank,
          student.grade,
          (student.duration_taken * 60).toFixed(1),
          student.correct_answers,
          student.wrong_answers,
          student.unanswered_questions,
          (student.accuracy_rate * 100).toFixed(1),
          student.violations_count
        ]);
        data = [headers, ...csvData].map(row => row.join(',')).join('\n');
        filename = `exam-analytics-${analytics.exam_metadata.exam_id}.csv`;
        mimeType = 'text/csv';
        break;
      case 'excel':
        // For Excel, we'll use CSV format as a simple alternative
        const excelHeaders = ['Nama Siswa', 'Skor', 'Persentase', 'Peringkat', 'Grade', 'Durasi (menit)', 'Jawaban Benar', 'Jawaban Salah', 'Tidak Dijawab', 'Akurasi (%)', 'Pelanggaran'];
        const excelData = analytics.student_performances.map(student => [
          student.student_name,
          student.score,
          student.percentage,
          student.rank,
          student.grade,
          (student.duration_taken * 60).toFixed(1),
          student.correct_answers,
          student.wrong_answers,
          student.unanswered_questions,
          (student.accuracy_rate * 100).toFixed(1),
          student.violations_count
        ]);
        data = [excelHeaders, ...excelData].map(row => row.join('\t')).join('\n');
        filename = `exam-analytics-${analytics.exam_metadata.exam_id}.xls`;
        mimeType = 'application/vnd.ms-excel';
        break;
    }

    // Create and trigger download
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
    toast.success(`Data berhasil diekspor ke ${format.toUpperCase()}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}j ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          <span className="text-gray-600">Memuat analitik ujian...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Ditemukan</h3>
          <p className="text-gray-600 mb-4">Analitik untuk ujian ini tidak tersedia.</p>
          <button
            onClick={() => navigate('/teacher/exams')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const scoreRangeData = Object.entries(analytics.class_statistics.score_ranges).map(([range, count]) => ({
    range,
    count,
    percentage: (count / analytics.class_statistics.students_completed * 100).toFixed(1)
  }));

  const gradeData = Object.entries(analytics.class_statistics.grade_distribution).map(([grade, count]) => ({
    grade,
    count,
    percentage: (count / analytics.class_statistics.students_completed * 100).toFixed(1)
  }));

  const timeDistributionData = Object.entries(analytics.time_analysis.time_distribution).map(([range, count]) => ({
    range,
    count
  }));

  const questionDifficultyData = analytics.questions_analysis.map(q => ({
    question: `Soal ${q.question_number}`,
    accuracy: (q.class_accuracy * 100).toFixed(1),
    difficulty: q.difficulty,
    isProblematic: q.is_problematic
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Analitik Ujian: {analytics.exam_metadata.exam_title}
                  </h1>
                  <p className="text-gray-600">
                    {analytics.exam_metadata.subject_name} • Kelas {analytics.exam_metadata.class_name}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export ke Excel (.xls)
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export ke CSV (.csv)
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export ke JSON (.json)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exam Metadata */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border border-purple-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Jenis Ujian</p>
                <p className="font-semibold text-gray-900">{analytics.exam_metadata.exam_type === 'quiz' ? 'Kuis' : 'Ulangan Harian'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Timer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Durasi</p>
                <p className="font-semibold text-gray-900">{analytics.exam_metadata.duration_minutes} menit</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Soal</p>
                <p className="font-semibold text-gray-900">{analytics.exam_metadata.total_questions}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Periode</p>
                <p className="font-semibold text-gray-900">{analytics.exam_metadata.academic_period}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.class_statistics.total_students}</p>
                <p className="text-sm text-gray-500">Terdaftar di kelas</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sudah Mengerjakan</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.class_statistics.students_completed}</p>
                <p className="text-sm text-gray-500">{analytics.class_statistics.completion_rate.toFixed(1)}% dari total</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rata-rata Kelas</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.class_statistics.class_average.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Dari {analytics.exam_metadata.max_score} poin</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tingkat Kelulusan</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.class_statistics.passing_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Siswa lulus ujian</p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Score Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Rentang Nilai</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreRangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'count' ? 'Jumlah Siswa' : name]}
                  labelFormatter={(label) => `Rentang: ${label}`}
                />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Grade</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} siswa`, 'Jumlah']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Per Soal</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={questionDifficultyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value + '%', 'Tingkat Ketepatan']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar 
                dataKey="accuracy" 
                fill="#10b981"
                name="Tingkat Ketepatan (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time and Violations Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Time Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Waktu Pengerjaan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} siswa`, 'Jumlah']} />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-600">Rata-rata</p>
                <p className="font-semibold text-gray-900">{formatDuration(analytics.time_analysis.average_completion_time * 60)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-600">Tercepat</p>
                <p className="font-semibold text-gray-900">{formatDuration(analytics.time_analysis.fastest_completion * 60)}</p>
              </div>
            </div>
          </div>

          {/* Violations Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Pelanggaran</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Total Pelanggaran</p>
                    <p className="text-sm text-gray-600">{analytics.violation_analysis.violation_percentage.toFixed(1)}% siswa melanggar</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{analytics.violation_analysis.total_violations}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(analytics.violation_analysis.violation_types).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Integritas Kelas: {analytics.violation_analysis.integrity_rating}</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Skor: {(analytics.violation_analysis.class_integrity_score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Performance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performa Individual Siswa</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peringkat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akurasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggaran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integritas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.student_performances.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {student.rank <= 3 && (
                          <Award className={`w-4 h-4 mr-2 ${
                            student.rank === 1 ? 'text-yellow-500' :
                            student.rank === 2 ? 'text-gray-400' :
                            'text-orange-400'
                          }`} />
                        )}
                        <span className="text-sm font-medium text-gray-900">#{student.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{student.score.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1">({student.percentage.toFixed(1)}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.grade === 'A' ? 'bg-green-100 text-green-800' :
                        student.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        student.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        student.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(student.duration_taken * 60)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(student.accuracy_rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        student.violations_count === 0 ? 'bg-green-100 text-green-800' :
                        student.violations_count <= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.violations_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          student.integrity_score >= 0.8 ? 'bg-green-500' :
                          student.integrity_score >= 0.6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-900">{(student.integrity_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Analitik dibuat: {formatDateTimeWithTimezone(analytics.generated_at)}</span>
            <span>Waktu pembuatan: {analytics.generation_time.toFixed(3)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamAnalyticsPage;