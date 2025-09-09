import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import ScoreTrendFilterSection from '@/components/analytics/ScoreTrendFilterSection';
import ScoreTrendAnalytics from '@/components/analytics/ScoreTrendAnalytics';
import { classService } from '@/services/class';
import { subjectService } from '@/services/subject';
import { userService } from '@/services/user';
import { expertiseProgramService } from '@/services/expertise';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher } from '@/types/user';
import { ScoreTrendFilters } from '@/types/scoreTrendAnalytics';
import toast from 'react-hot-toast';

interface TeacherAnalyticsFilters {
  dateRange: { start: string; end: string };
  selectedClass: string;
  selectedSubject: string;
  selectedGrade: string;
  selectedTeacher: string;
  selectedExpertise: string;
  activeTab: string;
}

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  expertisePrograms: ExpertiseProgram[];
}

const TeacherAnalyticsPage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRouter();

  // Filter state
  const [filters, setFilters] = useState<TeacherAnalyticsFilters>({
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
      end: new Date().toISOString().split('T')[0]
    },
    selectedClass: '',
    selectedSubject: '',
    selectedGrade: '',
    selectedTeacher: '',
    selectedExpertise: '',
    activeTab: 'overview'
  });

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    classes: [],
    subjects: [],
    teachers: [],
    expertisePrograms: []
  });

  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!token) return;

      try {
        setFilterOptionsLoading(true);

        const [classesResponse, subjectsResponse, teachersResponse, expertiseResponse] = await Promise.all([
          classService.getClasses(token, { limit: 100 }),
          subjectService.getSubjects(token, { limit: 100 }),
          userService.getBasicTeachers(token),
          expertiseProgramService.getExpertisePrograms(token, { limit: 100 })
        ]);

        setFilterOptions({
          classes: classesResponse.data || [],
          subjects: subjectsResponse.data || [],
          teachers: teachersResponse || [],
          expertisePrograms: expertiseResponse.data || []
        });
      } catch (error) {
        console.error('Error loading filter options:', error);
        toast.error('Gagal memuat opsi filter');
      } finally {
        setFilterOptionsLoading(false);
      }
    };

    loadFilterOptions();
  }, [token]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: TeacherAnalyticsFilters) => {
    setFilters(newFilters);
  };

  // Clear all filters
  const onClearFilters = () => {
    setFilters({
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
  };

  // Convert local filters to ScoreTrendAnalytics format
  const getScoreTrendAnalyticsFilters = (): ScoreTrendFilters => {
    const scoreTrendFilters: ScoreTrendFilters = {
      group_by: filters.activeTab === 'overview' ? 'class' : filters.activeTab as any
    };

    if (filters.dateRange.start) {
      scoreTrendFilters.start_date = new Date(filters.dateRange.start).toISOString();
    }
    if (filters.dateRange.end) {
      scoreTrendFilters.end_date = new Date(filters.dateRange.end).toISOString();
    }
    if (filters.selectedClass) {
      scoreTrendFilters.class_id = filters.selectedClass;
    }
    if (filters.selectedSubject) {
      scoreTrendFilters.subject_id = filters.selectedSubject;
    }
    if (filters.selectedGrade) {
      scoreTrendFilters.grade_level = parseInt(filters.selectedGrade);
    }
    if (filters.selectedTeacher) {
      scoreTrendFilters.teacher_id = filters.selectedTeacher;
    }
    if (filters.selectedExpertise) {
      scoreTrendFilters.expertise_id = filters.selectedExpertise;
    }

    return scoreTrendFilters;
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
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Analitik Pembelajaran
                  </h1>
                  <p className="text-gray-600">
                    Analisis tren nilai dan performa siswa berdasarkan berbagai kriteria
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="space-y-4 mb-6">
          <ScoreTrendFilterSection
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
            onClearFilters={onClearFilters}
          />
        </div>

        {/* Analytics Chart */}
        <div className="space-y-6">
          <ScoreTrendAnalytics 
            defaultFilters={getScoreTrendAnalyticsFilters()}
            height={400}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalyticsPage;