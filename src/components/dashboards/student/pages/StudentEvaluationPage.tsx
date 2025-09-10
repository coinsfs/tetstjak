import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Target, TrendingUp, Calendar, BookOpen, Users } from 'lucide-react';
import ScoreTrendAnalytics, { ScoreTrendAnalyticsRef } from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics, { SubjectMasteryAnalyticsRef } from '@/components/analytics/SubjectMasteryAnalytics';
import ScoreTrendFilterSection from '@/components/analytics/ScoreTrendFilterSection';
import SubjectMasteryFilterSection from '@/components/analytics/SubjectMasteryFilterSection';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import { studentExamService } from '@/services/studentExam';
import { classService } from '@/services/class';
import { subjectService } from '@/services/subject';
import { userService } from '@/services/user';
import { expertiseProgramService } from '@/services/expertise';
import { convertUTCToWIB, getCurrentWIBDateTime } from '@/utils/timezone';
import { ScoreTrendFilters } from '@/types/scoreTrendAnalytics';
import { SubjectMasteryFilters } from '@/types/subjectMastery';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher, BasicStudent } from '@/types/user';
import toast from 'react-hot-toast';

interface StudentEvaluationPageProps {
  user: any;
}

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  students: BasicStudent[];
  expertisePrograms: ExpertiseProgram[];
  academicPeriods: any[];
}

const StudentEvaluationPage: React.FC<StudentEvaluationPageProps> = ({ user }) => {
  const { token } = useAuth();
  
  // Refs for analytics components
  const scoreTrendRef = useRef<ScoreTrendAnalyticsRef>(null);
  const subjectMasteryRef = useRef<SubjectMasteryAnalyticsRef>(null);

  // Get default date range (90 days ago to today)
  const getDefaultDateRange = () => {
    const end = getCurrentWIBDateTime();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    return {
      start: start.toISOString().split('T')[0] + 'T00:00',
      end: end
    };
  };

  // Score Trend Filters State
  const [scoreTrendFilters, setScoreTrendFilters] = useState<ScoreTrendFilters>({
    dateRange: getDefaultDateRange(),
    selectedClass: '',
    selectedSubject: '',
    selectedGrade: '',
    selectedTeacher: '',
    selectedExpertise: '',
    selectedStudent: user?._id || '',
    selectedAcademicPeriod: '',
    activeTab: 'overview'
  });

  // Subject Mastery Filters State
  const [subjectMasteryFilters, setSubjectMasteryFilters] = useState<SubjectMasteryFilters>({
    dateRange: getDefaultDateRange(),
    selectedClass: '',
    selectedSubject: '',
    selectedGrade: '',
    selectedExpertise: '',
    selectedStudent: user?._id || '',
    selectedTeacher: '',
    minExamsPerSubject: 1,
    includeZeroScores: false
  });

  // Filter Options State
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    classes: [],
    subjects: [],
    teachers: [],
    students: [],
    expertisePrograms: [],
    academicPeriods: []
  });

  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Mock performance data for student
  const mockStudentTrend = [
    { exam_date: '2024-01-15T10:00:00Z', score: 75 },
    { exam_date: '2024-01-22T10:00:00Z', score: 82 },
    { exam_date: '2024-01-29T10:00:00Z', score: 78 },
    { exam_date: '2024-02-05T10:00:00Z', score: 85 },
    { exam_date: '2024-02-12T10:00:00Z', score: 88 }
  ];

  const mockClassTrend = [
    { exam_date: '2024-01-15T10:00:00Z', average_score: 72 },
    { exam_date: '2024-01-22T10:00:00Z', average_score: 74 },
    { exam_date: '2024-01-29T10:00:00Z', average_score: 76 },
    { exam_date: '2024-02-05T10:00:00Z', average_score: 78 },
    { exam_date: '2024-02-12T10:00:00Z', average_score: 80 }
  ];

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!token) return;

      try {
        setFilterOptionsLoading(true);

        // Load academic periods
        const academicPeriods = await studentExamService.getAcademicPeriods(token);
        
        // For students, we only need academic periods as they can only see their own data
        // Other filter options can be empty arrays since they won't be visible
        setFilterOptions({
          classes: [],
          subjects: [],
          teachers: [],
          students: [],
          expertisePrograms: [],
          academicPeriods: academicPeriods || []
        });

        // Set default academic period to active one if available
        try {
          const activeAcademicPeriod = await studentExamService.getActiveAcademicPeriod(token);
          if (activeAcademicPeriod) {
            setScoreTrendFilters(prev => ({
              ...prev,
              selectedAcademicPeriod: activeAcademicPeriod._id
            }));
            setSubjectMasteryFilters(prev => ({
              ...prev,
              selectedAcademicPeriod: activeAcademicPeriod._id
            }));
          }
        } catch (error) {
          console.log('No active academic period found');
        }

      } catch (error) {
        console.error('Error loading filter options:', error);
        toast.error('Gagal memuat opsi filter');
      } finally {
        setFilterOptionsLoading(false);
      }
    };

    loadFilterOptions();
  }, [token]);

  // Handle Score Trend Filters Change
  const handleScoreTrendFiltersChange = (newFilters: ScoreTrendFilters) => {
    setScoreTrendFilters(newFilters);
  };

  // Handle Subject Mastery Filters Change
  const handleSubjectMasteryFiltersChange = (newFilters: SubjectMasteryFilters) => {
    setSubjectMasteryFilters(newFilters);
  };

  // Clear Score Trend Filters
  const clearScoreTrendFilters = () => {
    setScoreTrendFilters({
      dateRange: getDefaultDateRange(),
      selectedClass: '',
      selectedSubject: '',
      selectedGrade: '',
      selectedTeacher: '',
      selectedExpertise: '',
      selectedStudent: user?._id || '',
      selectedAcademicPeriod: '',
      activeTab: 'overview'
    });
  };

  // Clear Subject Mastery Filters
  const clearSubjectMasteryFilters = () => {
    setSubjectMasteryFilters({
      dateRange: getDefaultDateRange(),
      selectedClass: '',
      selectedSubject: '',
      selectedGrade: '',
      selectedExpertise: '',
      selectedStudent: user?._id || '',
      selectedTeacher: '',
      minExamsPerSubject: 1,
      includeZeroScores: false
    });
  };

  // Convert filters to API format for Score Trend
  const getScoreTrendApiFilters = () => {
    return {
      start_date: scoreTrendFilters.dateRange.start ? new Date(scoreTrendFilters.dateRange.start).toISOString() : undefined,
      end_date: scoreTrendFilters.dateRange.end ? new Date(scoreTrendFilters.dateRange.end).toISOString() : undefined,
      student_id: scoreTrendFilters.selectedStudent,
      academic_period_id: scoreTrendFilters.selectedAcademicPeriod,
      group_by: 'student'
    };
  };

  // Convert filters to API format for Subject Mastery
  const getSubjectMasteryApiFilters = () => {
    return {
      start_date: subjectMasteryFilters.dateRange.start ? new Date(subjectMasteryFilters.dateRange.start).toISOString() : undefined,
      end_date: subjectMasteryFilters.dateRange.end ? new Date(subjectMasteryFilters.dateRange.end).toISOString() : undefined,
      student_id: subjectMasteryFilters.selectedStudent,
      academic_period_id: subjectMasteryFilters.selectedAcademicPeriod,
      min_exams_per_subject: subjectMasteryFilters.minExamsPerSubject,
      include_zero_scores: subjectMasteryFilters.includeZeroScores
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluasi Pembelajaran</h1>
            <p className="text-gray-600">Analisis performa dan perkembangan belajar Anda</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Rata-rata Nilai</p>
                <p className="text-xl font-bold text-blue-700">82.5</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Ujian Selesai</p>
                <p className="text-xl font-bold text-green-700">24</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Mata Pelajaran</p>
                <p className="text-xl font-bold text-purple-700">8</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Peringkat Kelas</p>
                <p className="text-xl font-bold text-orange-700">5/32</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tren Performa</h2>
            <p className="text-sm text-gray-600">Perkembangan nilai Anda dibandingkan rata-rata kelas</p>
          </div>
        </div>
        
        <PerformanceTrendChart 
          studentTrend={mockStudentTrend}
          classTrend={mockClassTrend}
        />
      </div>

      {/* Score Trend Analytics */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analisis Tren Nilai</h2>
            <p className="text-sm text-gray-600">Analisis perkembangan nilai berdasarkan waktu</p>
          </div>
        </div>

        {/* Score Trend Filter */}
        <ScoreTrendFilterSection
          filters={scoreTrendFilters}
          onFiltersChange={handleScoreTrendFiltersChange}
          filterOptions={filterOptions}
          filterOptionsLoading={filterOptionsLoading}
          onClearFilters={clearScoreTrendFilters}
          visibleFilterIds={['dateStart', 'dateEnd', 'academicPeriod']}
        />

        {/* Score Trend Chart */}
        <ScoreTrendAnalytics
          ref={scoreTrendRef}
          defaultFilters={getScoreTrendApiFilters()}
          height={300}
        />
      </div>

      {/* Subject Mastery Analytics */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Penguasaan Mata Pelajaran</h2>
            <p className="text-sm text-gray-600">Analisis tingkat penguasaan per mata pelajaran</p>
          </div>
        </div>

        {/* Subject Mastery Filter */}
        <SubjectMasteryFilterSection
          filters={subjectMasteryFilters}
          onFiltersChange={handleSubjectMasteryFiltersChange}
          onClearFilters={clearSubjectMasteryFilters}
          filterOptions={filterOptions}
          filterOptionsLoading={filterOptionsLoading}
          visibleFilterIds={['dateStart', 'dateEnd', 'academicPeriod']}
        />

        {/* Subject Mastery Chart */}
        <SubjectMasteryAnalytics
          ref={subjectMasteryRef}
          defaultFilters={getSubjectMasteryApiFilters()}
          height={400}
          title="Radar Penguasaan Mata Pelajaran"
        />
      </div>
    </div>
  );
};

export default StudentEvaluationPage;