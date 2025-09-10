import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studentExamService } from '@/services/studentExam';
import { TrendingUp, BarChart3, Target, Calendar, Filter } from 'lucide-react';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics from '@/components/analytics/SubjectMasteryAnalytics';

const StudentEvaluationPage: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myStatistics, setMyStatistics] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 180 days ago
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchMyStatistics = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await studentExamService.getMyStatistics(token);
        setMyStatistics(data);
      } catch (err) {
        console.error('Error fetching my statistics:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data statistik');
      } finally {
        setLoading(false);
      }
    };

    fetchMyStatistics();
  }, [token]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };

  const getScoreTrendFilters = () => {
    return {
      start_date: dateRange.start ? new Date(dateRange.start).toISOString() : undefined,
      end_date: dateRange.end ? new Date(dateRange.end).toISOString() : undefined,
      group_by: 'student'
    };
  };

  const getSubjectMasteryFilters = () => {
    return {
      start_date: dateRange.start ? new Date(dateRange.start).toISOString() : undefined,
      end_date: dateRange.end ? new Date(dateRange.end).toISOString() : undefined,
      min_exams_per_subject: 1,
      include_zero_scores: false
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-gray-600">Memuat data evaluasi...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Gagal Memuat Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluasi Performa</h1>
            <p className="text-gray-600">Analisis mendalam tentang perkembangan akademik Anda</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Filter Periode Analisis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange(e, 'start')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange(e, 'end')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {myStatistics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ringkasan Performa</h2>
              <p className="text-gray-600">Perbandingan performa Anda dengan kelas</p>
            </div>
          </div>

          <PerformanceTrendChart 
            studentTrend={myStatistics.student_statistics.trend_scores_student}
            classTrend={myStatistics.class_statistics.trend_scores_class}
          />
        </div>
      )}

      {/* Score Trend Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tren Nilai</h2>
            <p className="text-gray-600">Perkembangan nilai Anda dari waktu ke waktu</p>
          </div>
        </div>

        <ScoreTrendAnalytics 
          defaultFilters={getScoreTrendFilters()}
          height={300}
        />
      </div>

      {/* Subject Mastery Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Penguasaan Mata Pelajaran</h2>
            <p className="text-gray-600">Analisis kemampuan Anda di setiap mata pelajaran</p>
          </div>
        </div>

        <SubjectMasteryAnalytics 
          defaultFilters={getSubjectMasteryFilters()}
          height={400}
        />
      </div>
    </div>
  );
};

export default StudentEvaluationPage;