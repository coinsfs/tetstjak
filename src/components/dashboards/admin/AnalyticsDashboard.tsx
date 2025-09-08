import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3, Users, BookOpen, GraduationCap, Filter, RotateCcw, Target } from 'lucide-react';
import ScoreTrendAnalytics, { ScoreTrendAnalyticsRef } from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics, { SubjectMasteryAnalyticsRef } from '@/components/analytics/SubjectMasteryAnalytics';
import FilterModal from '@/components/modals/FilterModal';
import { classService } from '@/services/class';
import { subjectService } from '@/services/subject';
import { expertiseProgramService } from '@/services/expertise';
import { userService } from '@/services/user';
import { studentExamService } from '@/services/studentExam';
import { convertWIBToUTC } from '@/utils/timezone';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher } from '@/types/user';
import { AcademicPeriod } from '@/types/common';
import toast from 'react-hot-toast';

const AnalyticsDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { user, token } = useAuth();
  const analyticsRef = useRef<ScoreTrendAnalyticsRef>(null);
  const subjectMasteryRef = useRef<SubjectMasteryAnalyticsRef>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'class' | 'subject' | 'grade' | 'teacher' | 'subject-mastery'>('overview');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('');
  
  // Filter options state
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<BasicTeacher[]>([]);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<AcademicPeriod | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!token) return;
      
      try {
        setFilterOptionsLoading(true);
        
        // Fetch all filter options in parallel
        const [classesResponse, subjectsResponse, teachersResponse, expertiseResponse, academicPeriodResponse] = await Promise.all([
          classService.getClasses(token, { limit: 100 }),
          subjectService.getSubjects(token, { limit: 100 }),
          userService.getBasicTeachers(token),
          expertiseProgramService.getExpertisePrograms(token, { limit: 100 }),
          studentExamService.getActiveAcademicPeriod(token).catch(() => null)
        ]);
        
        setClasses(classesResponse.data || []);
        setSubjects(subjectsResponse.data || []);
        setTeachers(teachersResponse || []);
        setExpertisePrograms(expertiseResponse.data || []);
        setActiveAcademicPeriod(academicPeriodResponse);
        
      } catch (error) {
        console.error('Error fetching filter options:', error);
        toast.error('Gagal memuat opsi filter');
      } finally {
        setFilterOptionsLoading(false);
      }
    };

    fetchFilterOptions();
  }, [token]);
  
  const handleRefresh = () => {
    if (activeTab === 'subject-mastery') {
      subjectMasteryRef.current?.refreshData();
    } else {
      analyticsRef.current?.refreshData();
    }
  };

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

  const handleExpertiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExpertise(e.target.value);
  };

  const clearAllFilters = () => {
    setDateRange({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedGrade('');
    setSelectedTeacher('');
    setSelectedExpertise('');
  };

  const getDefaultFilters = () => {
    const filters: any = {};

    // Include group_by based on active tab (only for score trend analytics)
    if (activeTab !== 'subject-mastery') {
      filters.group_by = activeTab === 'overview' ? 'class' : activeTab;
    }

    // Add academic period if available
    if (activeAcademicPeriod) {
      filters.academic_period_id = activeAcademicPeriod._id;
    }

    // Convert date range to UTC ISO format
    if (dateRange.start) {
      filters.start_date = convertWIBToUTC(dateRange.start + 'T00:00');
    }
    if (dateRange.end) {
      filters.end_date = convertWIBToUTC(dateRange.end + 'T23:59');
    }
    
    // Only add other parameters if they have values
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
    if (selectedExpertise) {
      filters.expertise_id = selectedExpertise;
    }

    return filters;
  };

  const getChartTitle = () => {
    switch (activeTab) {
      case 'class': return 'Tren Nilai Berdasarkan Kelas';
      case 'subject': return 'Tren Nilai Berdasarkan Mata Pelajaran';
      case 'grade': return 'Tren Nilai Berdasarkan Jenjang';
      case 'teacher': return 'Tren Nilai Berdasarkan Guru';
      case 'subject-mastery': return 'Penguasaan Mata Pelajaran';
      default: return 'Tren Nilai Keseluruhan';
    }
  };

  const hasActiveFilters = () => {
    const defaultStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    return (dateRange.start !== defaultStart) || 
           (dateRange.end !== defaultEnd) || 
           selectedClass || 
           selectedSubject || 
           selectedGrade || 
           selectedTeacher;
           selectedExpertise;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    
    const defaultStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (dateRange.start !== defaultStart) count++;
    if (dateRange.end !== defaultEnd) count++;
    if (selectedClass) count++;
    if (selectedSubject) count++;
    if (selectedGrade) count++;
    if (selectedTeacher) count++;
    if (selectedExpertise) count++;
    return count;
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };
  
  const tabs = [
    { id: 'overview', label: 'Keseluruhan', icon: BarChart3 },
    { id: 'class', label: 'Kelas', icon: Users },
    { id: 'subject', label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'grade', label: 'Jenjang', icon: GraduationCap },
    { id: 'teacher', label: 'Guru', icon: Users },
    { id: 'subject-mastery', label: 'Penguasaan Mapel', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-3">
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
        <div className="bg-white shadow-sm rounded-lg">
          <nav className="flex overflow-x-auto scrollbar-hide border-b border-gray-200" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 text-sm font-medium text-center border-b-2 transition-colors min-w-0 ${
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
        <div className="hidden md:block bg-white shadow-sm rounded-lg p-3">
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
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    Kelas {getGradeLabel(classItem.grade_level)} {classItem.expertise_details?.abbreviation} {classItem.name}
                  </option>
                ))}
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
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
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
              <div className="col-span-full sm:col-span-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Guru
                </label>
                <select
                  value={selectedTeacher}
                  onChange={handleTeacherChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={filterOptionsLoading}
                >
                  <option value="">Semua Guru</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Expertise Filter */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Program Keahlian
              </label>
              <select
                value={selectedExpertise}
                onChange={handleExpertiseChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={filterOptionsLoading}
              >
                <option value="">Semua Program Keahlian</option>
                {filterOptionsLoading ? (
                  <option disabled>Memuat...</option>
                ) : (
                  expertisePrograms.map((expertise) => (
                    <option key={expertise._id} value={expertise._id}>
                      {expertise.name} ({expertise.abbreviation})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white shadow-sm rounded-lg hover:bg-gray-50 transition-colors"
            disabled={filterOptionsLoading}
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
        <div className="space-y-3">
          <div className="bg-white shadow-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{getChartTitle()}</h2>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {activeTab === 'subject-mastery' ? (
            <SubjectMasteryAnalytics 
              ref={subjectMasteryRef}
              defaultFilters={getDefaultFilters()}
            />
          ) : (
            <ScoreTrendAnalytics 
              ref={analyticsRef}
              defaultFilters={getDefaultFilters()}
            />
          )}
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
          selectedExpertise={selectedExpertise}
          activeTab={activeTab}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          expertisePrograms={expertisePrograms}
          filterOptionsLoading={filterOptionsLoading}
          onDateChange={handleDateChange}
          onClassChange={handleClassChange}
          onSubjectChange={handleSubjectChange}
          onGradeChange={handleGradeChange}
          onTeacherChange={handleTeacherChange}
          onExpertiseChange={handleExpertiseChange}
          onClearFilters={clearAllFilters}
          getActiveFilterCount={getActiveFilterCount}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;