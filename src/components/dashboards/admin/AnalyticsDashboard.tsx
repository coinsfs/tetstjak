import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3, Users, BookOpen, GraduationCap } from 'lucide-react';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';

const AnalyticsDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'class' | 'subject' | 'grade' | 'teacher'>('overview');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeacher(e.target.value);
  };

  const getDefaultFilters = () => {
    const filters: any = {
      start_date: dateRange.start ? new Date(dateRange.start).toISOString() : undefined,
      end_date: dateRange.end ? new Date(dateRange.end).toISOString() : undefined,
      group_by: activeTab === 'overview' ? 'class' : activeTab
    };

    if (selectedClass) filters.class_id = selectedClass;
    if (selectedSubject) filters.subject_id = selectedSubject;
    if (selectedGrade) filters.grade_level = parseInt(selectedGrade);
    if (selectedTeacher) filters.teacher_id = selectedTeacher;

    return filters;
  };

  const getChartTitle = () => {
    switch (activeTab) {
      case 'class': return 'Tren Nilai Berdasarkan Kelas';
      case 'subject': return 'Tren Nilai Berdasarkan Mata Pelajaran';
      case 'grade': return 'Tren Nilai Berdasarkan Jenjang';
      case 'teacher': return 'Tren Nilai Berdasarkan Guru';
      default: return 'Tren Nilai Keseluruhan';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard Analitik
                  </h1>
                  <p className="text-gray-600">
                    Analisis tren nilai ujian di seluruh sistem
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Keseluruhan
                </div>
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'class'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Kelas
                </div>
              </button>
              <button
                onClick={() => setActiveTab('subject')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subject'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Mata Pelajaran
                </div>
              </button>
              <button
                onClick={() => setActiveTab('grade')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'grade'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Jenjang
                </div>
              </button>
              <button
                onClick={() => setActiveTab('teacher')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teacher'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Guru
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Semua Kelas</option>
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
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                <option value="math">Matematika</option>
                <option value="science">IPA</option>
                <option value="english">Bahasa Inggris</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenjang
              </label>
              <select
                value={selectedGrade}
                onChange={handleGradeChange}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Semua Jenjang</option>
                <option value="10">Kelas 10</option>
                <option value="11">Kelas 11</option>
                <option value="12">Kelas 12</option>
              </select>
            </div>
          </div>
          
          {activeTab === 'teacher' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guru
              </label>
              <select
                value={selectedTeacher}
                onChange={handleTeacherChange}
                className="w-full md:w-1/2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Semua Guru</option>
                <option value="teacher1">Budi Santoso</option>
                <option value="teacher2">Siti Rahayu</option>
                <option value="teacher3">Ahmad Fauzi</option>
              </select>
            </div>
          )}
        </div>

        {/* Analytics Chart */}
        <ScoreTrendAnalytics 
          title={getChartTitle()}
          defaultFilters={getDefaultFilters()}
          showFilters={false}
          height={500}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;