import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3, RotateCcw } from 'lucide-react';
import ScoreTrendAnalytics, { ScoreTrendAnalyticsRef } from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics, { SubjectMasteryAnalyticsRef } from '@/components/analytics/SubjectMasteryAnalytics';
import AnalyticsFilterSection from '@/components/analytics/AnalyticsFilterSection';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'class' | 'subject' | 'grade' | 'teacher'>('overview');
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
    // Refresh both charts
    analyticsRef.current?.refreshData();
    subjectMasteryRef.current?.refreshData();
  };

  const handleFiltersChange = (newFilters: {
    dateRange: { start: string; end: string };
    selectedClass: string;
    selectedSubject: string;
    selectedGrade: string;
    selectedTeacher: string;
    selectedExpertise: string;
  }) => {
    setDateRange(newFilters.dateRange);
    setSelectedClass(newFilters.selectedClass);
    setSelectedSubject(newFilters.selectedSubject);
    setSelectedGrade(newFilters.selectedGrade);
    setSelectedTeacher(newFilters.selectedTeacher);
    setSelectedExpertise(newFilters.selectedExpertise);
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

  // Common filters for both charts
  const getCommonFilters = () => {
    const filters: any = {};

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

  // Specific filters for Score Trend Analytics (includes group_by)
  const getScoreTrendFilters = () => {
    const commonFilters = getCommonFilters();
    return {
      ...commonFilters,
      group_by: activeTab === 'overview' ? 'class' : activeTab
    };
  };

  // Specific filters for Subject Mastery Analytics (no group_by)
  const getSubjectMasteryFilters = () => {
    return getCommonFilters();
  };

  const getScoreTrendChartTitle = () => {
    switch (activeTab) {
      case 'class': return 'Tren Nilai Berdasarkan Kelas';
      case 'subject': return 'Tren Nilai Berdasarkan Mata Pelajaran';
      case 'grade': return 'Tren Nilai Berdasarkan Jenjang';
      case 'teacher': return 'Tren Nilai Berdasarkan Guru';
      default: return 'Tren Nilai Keseluruhan';
    }
  };

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

        {/* Filter Section */}
        <AnalyticsFilterSection
          filters={{
            dateRange,
            selectedClass,
            selectedSubject,
            selectedGrade,
            selectedTeacher,
            selectedExpertise
          }}
          onFiltersChange={handleFiltersChange}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          filterOptions={{
            classes,
            subjects,
            teachers,
            expertisePrograms
          }}
          filterOptionsLoading={filterOptionsLoading}
          onClearFilters={clearAllFilters}
        />

        {/* Analytics Charts */}
        <div className="space-y-3">
          {/* Score Trend Analytics */}
          <div className="bg-white shadow-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{getScoreTrendChartTitle()}</h2>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <ScoreTrendAnalytics 
            ref={analyticsRef}
            defaultFilters={getScoreTrendFilters()}
          />
          
          {/* Subject Mastery Analytics */}
          <div className="bg-white shadow-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Penguasaan Mata Pelajaran</h2>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <SubjectMasteryAnalytics 
            ref={subjectMasteryRef}
            defaultFilters={getSubjectMasteryFilters()}
          />
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;