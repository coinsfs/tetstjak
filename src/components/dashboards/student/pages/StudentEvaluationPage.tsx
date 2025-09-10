import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Target, BookOpen, Calendar, Filter } from 'lucide-react';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics from '@/components/analytics/SubjectMasteryAnalytics';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import { studentExamService } from '@/services/studentExam';
import { MyStatisticsResponse } from '@/services/studentExam';

const StudentEvaluationPage: React.FC = () => {
  const { token } = useAuth();
  const [myStats, setMyStats] = useState<MyStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Define visible filters for student - only academic period, start date, and end date
  const studentVisibleFilters = ['dateStart', 'dateEnd', 'academicPeriod'];

  useEffect(() => {
    const fetchMyStatistics = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const stats = await studentExamService.getMyStatistics(token);
        setMyStats(stats);
      } catch (error) {
        console.error('Error fetching my statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyStatistics();
  }, [token]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluasi Performa</h1>
          <p className="text-gray-600">Analisis mendalam tentang performa akademik Anda</p>
        </div>
      </div>

      {/* Performance Overview */}
      {myStats && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Ringkasan Performa</h2>
            <span className="text-sm text-gray-500">Perbandingan performa Anda dengan kelas</span>
          </div>
          
          <PerformanceTrendChart 
            studentTrend={myStats.student_statistics.trend_scores_student}
            classTrend={myStats.class_statistics.trend_scores_class}
          />
        </div>
      )}

      {/* Score Trend Analytics */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Analisis Tren Nilai</h2>
          <span className="text-sm text-gray-500">Perkembangan nilai dari waktu ke waktu</span>
        </div>
        
        <ScoreTrendAnalytics 
          height={300}
          visibleFilterIds={studentVisibleFilters}
        />
      </div>

      {/* Subject Mastery Analytics */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Penguasaan Mata Pelajaran</h2>
          <span className="text-sm text-gray-500">Analisis penguasaan per mata pelajaran</span>
        </div>
        
        <SubjectMasteryAnalytics 
          height={300}
          visibleFilterIds={studentVisibleFilters}
        />
      </div>

      {/* Additional Insights */}
      {myStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rata-rata Keseluruhan</p>
                <p className="text-lg font-semibold text-gray-900">
                  {myStats.student_statistics.overall_average_student.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nilai Terbaik</p>
                <p className="text-lg font-semibold text-gray-900">
                  {myStats.student_statistics.best_score_student.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nilai Terbaru</p>
                <p className="text-lg font-semibold text-gray-900">
                  {myStats.student_statistics.latest_score_student.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Filter className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tingkat Partisipasi</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(myStats.student_statistics.participant_rate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEvaluationPage;