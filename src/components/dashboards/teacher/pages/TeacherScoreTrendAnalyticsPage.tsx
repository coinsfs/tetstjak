import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';
import { teacherExamService } from '@/services/teacherExam';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';

const TeacherScoreTrendAnalyticsPage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    end: new Date().toISOString().split('T')[0]
  });

  // Fetch classes and subjects for the teacher
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // In a real implementation, you would fetch the teacher's classes and subjects
        // For now, we'll use mock data or leave empty
        const classesData = await teacherExamService.getTeacherExams(token, { limit: 100 });
        // We would extract unique classes and subjects from the exams
        // This is a simplified implementation
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    };

    fetchData();
  }, [token]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };

  const getDefaultFilters = () => {
    const filters: any = {
      start_date: dateRange.start ? new Date(dateRange.start).toISOString() : undefined,
      end_date: dateRange.end ? new Date(dateRange.end).toISOString() : undefined,
      group_by: 'class'
    };

    if (selectedClass) filters.class_id = selectedClass;
    if (selectedSubject) filters.subject_id = selectedSubject;

    return filters;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher')}
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
                    Analitik Tren Nilai
                  </h1>
                  <p className="text-gray-600">
                    Analisis tren nilai ujian berdasarkan kelas dan mata pelajaran
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange(e, 'start')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Semua Kelas</option>
                {/* In a real implementation, you would map through actual classes */}
                <option value="class1">Kelas 10 IPA 1</option>
                <option value="class2">Kelas 11 IPA 2</option>
                <option value="class3">Kelas 12 IPS 1</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                {/* In a real implementation, you would map through actual subjects */}
                <option value="math">Matematika</option>
                <option value="science">IPA</option>
                <option value="english">Bahasa Inggris</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <ScoreTrendAnalytics 
          title="Tren Nilai Ujian Kelas"
          defaultFilters={getDefaultFilters()}
          showFilters={false}
          height={400}
        />
      </div>
    </div>
  );
};

export default TeacherScoreTrendAnalyticsPage;