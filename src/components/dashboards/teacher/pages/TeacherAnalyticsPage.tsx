import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, Target, Users, BookOpen, RefreshCw } from 'lucide-react';
import ScoreTrendAnalytics, { ScoreTrendAnalyticsRef } from '@/components/analytics/ScoreTrendAnalytics';
import SubjectMasteryAnalytics, { SubjectMasteryAnalyticsRef } from '@/components/analytics/SubjectMasteryAnalytics';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher, BasicStudent } from '@/types/user';
import { classService } from '@/services/class';
import { subjectService } from '@/services/subject';
import { expertiseProgramService } from '@/services/expertise';
import { userService } from '@/services/user';
import toast from 'react-hot-toast';

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  students: BasicStudent[];
  expertisePrograms: ExpertiseProgram[];
  academicPeriods: any[];
}

const TeacherAnalyticsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'score-trend' | 'subject-mastery'>('score-trend');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    classes: [],
    subjects: [],
    teachers: [],
    students: [],
    expertisePrograms: [],
    academicPeriods: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Refs for refreshing analytics
  const scoreTrendRef = useRef<ScoreTrendAnalyticsRef>(null);
  const subjectMasteryRef = useRef<SubjectMasteryAnalyticsRef>(null);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!token) return;

      try {
        setFilterOptionsLoading(true);

        const [classesRes, subjectsRes, expertiseRes] = await Promise.all([
          classService.getClasses(token, { limit: 100 }),
          subjectService.getSubjects(token, { limit: 100 }),
          expertiseProgramService.getExpertisePrograms(token, { limit: 100 })
        ]);

        setFilterOptions({
          classes: classesRes.data || [],
          subjects: subjectsRes.data || [],
          teachers: [],
          students: [],
          expertisePrograms: expertiseRes.data || [],
          academicPeriods: []
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
        toast.error('Gagal memuat opsi filter');
      } finally {
        setFilterOptionsLoading(false);
      }
    };

    loadFilterOptions();
  }, [token]);

  // Load student options for async select
  const loadStudentOptions = async (inputValue: string, callback: (options: any[]) => void) => {
    if (!token) {
      callback([]);
      return;
    }

    try {
      const students = await userService.getBasicStudents(token, inputValue);
      const options = students.map(student => ({
        value: student._id,
        label: student.full_name + (student.class_name ? ` (${student.class_name})` : '')
      }));
      callback(options);
    } catch (error) {
      console.error('Failed to load students:', error);
      callback([]);
    }
  };

  // Load teacher options for async select
  const loadTeacherOptions = async (inputValue: string, callback: (options: any[]) => void) => {
    if (!token) {
      callback([]);
      return;
    }

    try {
      const teachers = await userService.getBasicTeachers(token, inputValue);
      const options = teachers.map(teacher => ({
        value: teacher._id,
        label: teacher.full_name
      }));
      callback(options);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      callback([]);
    }
  };

  const handleRefreshAll = () => {
    if (activeTab === 'score-trend') {
      scoreTrendRef.current?.refreshData();
    } else {
      subjectMasteryRef.current?.refreshData();
    }
    toast.success('Data analitik diperbarui');
  };

  const tabs = [
    {
      id: 'score-trend' as const,
      label: 'Tren Nilai',
      icon: TrendingUp,
      description: 'Analisis perkembangan nilai siswa dari waktu ke waktu'
    },
    {
      id: 'subject-mastery' as const,
      label: 'Penguasaan Mata Pelajaran',
      icon: Target,
      description: 'Analisis tingkat penguasaan siswa terhadap berbagai mata pelajaran'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitik Pembelajaran</h1>
          <p className="text-gray-600 mt-1">
            Pantau dan analisis perkembangan pembelajaran siswa
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Perbarui Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm rounded-lg">
        <nav className="flex overflow-x-auto scrollbar-hide border-b border-gray-200" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors min-w-0 ${
                  isActive
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <IconComponent className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </div>
                {isActive && (
                  <p className="text-xs text-gray-500 mt-1 text-left">
                    {tab.description}
                  </p>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {activeTab === 'score-trend' && (
          <ScoreTrendAnalytics
            ref={scoreTrendRef}
            height={400}
            defaultFilters={{
              dateRange: {
                start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              },
              activeTab: 'class'
            }}
          />
        )}

        {activeTab === 'subject-mastery' && (
          <SubjectMasteryAnalytics
            ref={subjectMasteryRef}
            height={400}
            title="Analisis Penguasaan Mata Pelajaran"
            visibleFilterIds={['dateStart', 'dateEnd', 'class', 'student', 'minExams', 'includeZero']}
            defaultFilters={{
              dateRange: {
                start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              },
              minExamsPerSubject: 1,
              includeZeroScores: false
            }}
          />
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Analisis Komprehensif</h3>
              <p className="text-sm text-gray-600">
                Dapatkan wawasan mendalam tentang perkembangan pembelajaran
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pantau Siswa</h3>
              <p className="text-sm text-gray-600">
                Lacak perkembangan individual dan kelompok siswa
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Evaluasi Pembelajaran</h3>
              <p className="text-sm text-gray-600">
                Identifikasi area yang perlu diperbaiki dalam pembelajaran
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalyticsPage;