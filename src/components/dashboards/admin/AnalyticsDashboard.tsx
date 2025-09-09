import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { ArrowLeft, BarChart3, RotateCcw } from 'lucide-react';
import ScoreTrendAnalytics, { ScoreTrendAnalyticsRef } from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics, { SubjectMasteryAnalyticsRef } from '@/components/analytics/SubjectMasteryAnalytics';
import ScoreTrendFilterSection from '@/components/analytics/ScoreTrendFilterSection';
import SubjectMasteryFilterSection from '@/components/analytics/SubjectMasteryFilterSection';
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
  
  // Score Trend Filters
  const [scoreTrendFilters, setScoreTrendFilters] = useState({
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    selectedClass: '',
    selectedSubject: '',
    selectedGrade: '',
    selectedTeacher: '',
    selectedExpertise: '',
    activeTab: 'overview'
  });
  
  // Subject Mastery Filters
  const [subjectMasteryFilters, setSubjectMasteryFilters] = useState({
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    selectedClass: '',
    selectedSubject: '',
    selectedGrade: '',
    selectedExpertise: '',
    selectedStudent: '',
    selectedTeacher: '',
    minExamsPerSubject: 1,
    includeZeroScores: false
  });
  
  // Filter options state
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<BasicTeacher[]>([]);
  const [students, setStudents] = useState<BasicStudent[]>([]);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<AcademicPeriod | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Load options functions for AsyncSelect
  const loadStudentOptions = (inputValue: string, callback: (options: any[]) => void) => {
    if (!token) {
      callback([]);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        const students = await userService.getBasicStudents(token, inputValue);
        const options = students.map(student => ({
          value: student._id,
          label: student.full_name
        }));
        callback(options);
      } catch (error) {
        console.error('Error loading student options:', error);
        callback([]);
      }
    }, 500);

    // Store timeout ID for potential cleanup
    return () => clearTimeout(timeoutId);
  };

  const loadTeacherOptions = (inputValue: string, callback: (options: any[]) => void) => {
    if (!token) {
      callback([]);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        const teachers = await userService.getBasicTeachers(token, inputValue);
        const options = teachers.map(teacher => ({
          value: teacher._id,
          label: teacher.full_name
        }));
        callback(options);
      } catch (error) {
        console.error('Error loading teacher options:', error);
        callback([]);
      }
    }, 500);

    // Store timeout ID for potential cleanup
    return () => clearTimeout(timeoutId);
  };

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!token) return;
      
      try {
        setFilterOptionsLoading(true);
        
        // Fetch all filter options in parallel
        const [classesResponse, subjectsResponse, teachersResponse, studentsResponse, expertiseResponse, academicPeriodsResponse, activeAcademicPeriodResponse] = await Promise.all([
          classService.getClasses(token, { limit: 100 }),
          subjectService.getSubjects(token, { limit: 100 }),
          userService.getBasicTeachers(token),
          userService.getBasicStudents(token),
          expertiseProgramService.getExpertisePrograms(token, { limit: 100 }),
          studentExamService.getAcademicPeriods(token),
          studentExamService.getActiveAcademicPeriod(token).catch(() => null)
        ]);
        
        setClasses(classesResponse.data || []);
        setSubjects(subjectsResponse.data || []);
        setTeachers(teachersResponse || []);
        setStudents(studentsResponse || []);
        setExpertisePrograms(expertiseResponse.data || []);
        setAcademicPeriods(academicPeriodsResponse || []);
        setActiveAcademicPeriod(activeAcademicPeriodResponse);
        
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

  // Score Trend Filter Handlers
  const handleScoreTrendFiltersChange = (newFilters: typeof scoreTrendFilters) => {
    setScoreTrendFilters(newFilters);
  };

  const clearScoreTrendFilters = () => {
    setScoreTrendFilters({
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      selectedClass: '',
      selectedSubject: '',
      selectedGrade: '',
      selectedTeacher: '',
      selectedExpertise: '',
      selectedStudent: '',
      selectedAcademicPeriod: '',
      activeTab: 'overview'
    });
  };

  // Subject Mastery Filter Handlers
  const handleSubjectMasteryFiltersChange = (newFilters: typeof subjectMasteryFilters) => {
    setSubjectMasteryFilters(newFilters);
  };

  const clearSubjectMasteryFilters = () => {
    setSubjectMasteryFilters({
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      selectedClass: '',
      selectedSubject: '',
      selectedGrade: '',
      selectedExpertise: '',
      selectedStudent: '',
      selectedTeacher: '',
      minExamsPerSubject: 1,
      includeZeroScores: false
    });
  };

  // Common filters helper
  const getCommonFilters = (filters: any) => {
    const commonFilters: any = {};

    // Add academic period if available
    if (activeAcademicPeriod) {
      commonFilters.academic_period_id = activeAcademicPeriod._id;
    }

    // Convert date range to UTC ISO format
    if (filters.dateRange.start) {
      commonFilters.start_date = convertWIBToUTC(filters.dateRange.start + 'T00:00');
    }
    if (filters.dateRange.end) {
      commonFilters.end_date = convertWIBToUTC(filters.dateRange.end + 'T23:59');
    }
    
    // Only add other parameters if they have values
    if (filters.selectedClass) {
      commonFilters.class_id = filters.selectedClass;
    }
    if (filters.selectedSubject) {
      commonFilters.subject_id = filters.selectedSubject;
    }
    if (filters.selectedGrade) {
      commonFilters.grade_level = parseInt(filters.selectedGrade);
    }
    if (filters.selectedTeacher) {
      commonFilters.teacher_id = filters.selectedTeacher;
    }
    if (filters.selectedExpertise) {
      commonFilters.expertise_id = filters.selectedExpertise;
    }
    if (filters.selectedStudent) {
      commonFilters.student_id = filters.selectedStudent;
    }
    if (filters.selectedAcademicPeriod) {
      commonFilters.academic_period_id = filters.selectedAcademicPeriod;
    }

    return commonFilters;
  };

  // Specific filters for Score Trend Analytics
  const getScoreTrendFilters = () => {
    const commonFilters = getCommonFilters(scoreTrendFilters);
    return {
      ...commonFilters,
      group_by: scoreTrendFilters.activeTab === 'overview' ? 'class' : scoreTrendFilters.activeTab
    };
  };

  // Specific filters for Subject Mastery Analytics
  const getSubjectMasteryFilters = () => {
    const commonFilters = getCommonFilters(subjectMasteryFilters);
    return {
      ...commonFilters,
      min_exams_per_subject: subjectMasteryFilters.minExamsPerSubject,
      include_zero_scores: subjectMasteryFilters.includeZeroScores,
      use_cache: true
    };
  };

  const getScoreTrendChartTitle = () => {
    switch (scoreTrendFilters.activeTab) {
      case 'class': return 'Tren Nilai Berdasarkan Kelas';
      case 'subject': return 'Tren Nilai Berdasarkan Mata Pelajaran';
      case 'grade': return 'Tren Nilai Berdasarkan Jenjang';
      case 'teacher': return 'Tren Nilai Berdasarkan Guru';
      default: return 'Tren Nilai Keseluruhan';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Score Trend Analytics Section */}
        <div className="space-y-3">
          {/* Score Trend Filter Section */}
          <ScoreTrendFilterSection
            filters={scoreTrendFilters}
            onFiltersChange={handleScoreTrendFiltersChange}
            filterOptions={{
              classes,
              subjects,
              teachers,
              students,
              expertisePrograms,
              academicPeriods
            }}
            filterOptionsLoading={filterOptionsLoading}
            onClearFilters={clearScoreTrendFilters}
            loadStudentOptions={loadStudentOptions}
            loadTeacherOptions={loadTeacherOptions}
          />
          
          {/* Score Trend Chart */}
          <div className="bg-white shadow-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{getScoreTrendChartTitle()}</h2>
              <button
                onClick={() => analyticsRef.current?.refreshData()}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh Tren Nilai"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <ScoreTrendAnalytics 
            ref={analyticsRef}
            defaultFilters={getScoreTrendFilters()}
          />
        </div>

        {/* Subject Mastery Analytics Section */}
        <div className="space-y-3">
          {/* Subject Mastery Filter Section */}
          <SubjectMasteryFilterSection
            filters={subjectMasteryFilters}
            onFiltersChange={handleSubjectMasteryFiltersChange}
            filterOptions={{
              classes,
              subjects,
              teachers,
              students,
              expertisePrograms,
              academicPeriods
            }}
            filterOptionsLoading={filterOptionsLoading}
            onClearFilters={clearSubjectMasteryFilters}
            loadStudentOptions={loadStudentOptions}
            loadTeacherOptions={loadTeacherOptions}
          />
          
          {/* Subject Mastery Chart */}
          <div className="bg-white shadow-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Penguasaan Mata Pelajaran</h2>
              <button
                onClick={() => subjectMasteryRef.current?.refreshData()}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh Penguasaan Mata Pelajaran"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <SubjectMasteryAnalytics 
            ref={subjectMasteryRef}
            title=""
            defaultFilters={getSubjectMasteryFilters()}
          />
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;