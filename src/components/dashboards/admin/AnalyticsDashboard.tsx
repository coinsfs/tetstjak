import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3, Users, BookOpen, GraduationCap, Filter } from 'lucide-react';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';
import FilterModal from '@/components/modals/FilterModal';

const AnalyticsDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'class' | 'subject' | 'grade' | 'teacher'>('overview');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
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

  const clearAllFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedGrade('');
    setSelectedTeacher('');
  };

  const getDefaultFilters = () => {
    const filters: any = {};

    // Always include group_by based on active tab
    filters.group_by = activeTab === 'overview' ? 'class' : activeTab;

    // Only add parameters if they have values
    if (dateRange.start) {
      filters.start_date = new Date(dateRange.start).toISOString();
    }
    if (dateRange.end) {
      filters.end_date = new Date(dateRange.end).toISOString();
    }
    if (selectedClass) {
      filters.class_id = selectedClass;
    }
    if (selectedSubject) {
      filters.subject_id = selectedSubject;
    }
    if (selectedGrade) {
      filters.grade_level = parseInt(selectedGrade);
    }
    if (selectedTeacher) {
      filters.teacher_id = selectedTeacher;
    }

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

  const hasActiveFilters = () => {
    return dateRange.start || dateRange.end || selectedClass || selectedSubject || selectedGrade || selectedTeacher;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange.start) count++;
    if (dateRange.end) count++;
    if (selectedClass) count++;
    if (selectedSubject) count++;
    if (selectedGrade) count++;
    if (selectedTeacher) count++;
    return count;
  };

  const tabs = [
    { id: 'overview', label: 'Keseluruhan', icon: BarChart3 },
    { id: 'class', label: 'Kelas', icon: Users },
    { id: 'subject', label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'grade', label: 'Jenjang', icon: GraduationCap },
    { id: 'teacher', label: 'Guru', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  Dashboard Analitik
                </h1>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
                  Analisis tren nilai ujian
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <nav className="flex overflow-x-auto border-b border-gray-200" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors min-w-0 ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Filter</h3>
            {hasActiveFilters() && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{getActiveFilterCount()} filter aktif</span>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange(e, 'start')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange(e, 'end')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Kelas
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Kelas</option>
                <option value="class1">Kelas 10 IPA 1</option>
                <option value="class2">Kelas 11 IPA 2</option>
                <option value="class3">Kelas 12 IPS 1</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                <option value="math">Matematika</option>
                <option value="science">IPA</option>
                <option value="english">Bahasa Inggris</option>
                <option value="indonesian">Bahasa Indonesia</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Jenjang
              </label>
              <select
                value={selectedGrade}
                onChange={handleGradeChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Jenjang</option>
                <option value="10">Kelas 10</option>
                <option value="11">Kelas 11</option>
                <option value="12">Kelas 12</option>
              </select>
            </div>
            
            {/* Teacher Filter - Only show when teacher tab is active */}
            {activeTab === 'teacher' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Guru
                </label>
                <select
                  value={selectedTeacher}
                  onChange={handleTeacherChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Guru</option>
                  <option value="teacher1">Budi Santoso</option>
                  <option value="teacher2">Siti Rahayu</option>
                  <option value="teacher3">Ahmad Fauzi</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter Data</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Analytics Chart */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{getChartTitle()}</h2>
          </div>
          
          <div className="p-4">
            <ScoreTrendAnalytics 
              title=""
              defaultFilters={getDefaultFilters()}
              showFilters={false}
            />
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          dateRange={dateRange}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          selectedGrade={selectedGrade}
          selectedTeacher={selectedTeacher}
          activeTab={activeTab}
          onDateChange={handleDateChange}
          onClassChange={handleClassChange}
          onSubjectChange={handleSubjectChange}
          onGradeChange={handleGradeChange}
          onTeacherChange={handleTeacherChange}
          onClearFilters={clearAllFilters}
          getActiveFilterCount={getActiveFilterCount}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;