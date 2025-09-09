import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher, BasicStudent } from '@/types/user';
import { AcademicPeriod } from '@/types/common';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string };
  selectedClass: string;
  selectedSubject: string;
  selectedGrade: string;
  selectedTeacher: string;
  selectedExpertise: string;
  selectedStudent: string;
  selectedAcademicPeriod: string;
  activeTab: string;
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  students: BasicStudent[];
  expertisePrograms: ExpertiseProgram[];
  academicPeriods: AcademicPeriod[];
  filterOptionsLoading: boolean;
  visibleFilterIds?: string[]; // Added this prop
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => void;
  onClassChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onGradeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTeacherChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onExpertiseChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onStudentChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAcademicPeriodChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
  getActiveFilterCount: () => number;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'select' | 'checkbox';
  value: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: Array<{ value: string; label: string }>;
  priority: number;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  dateRange,
  selectedClass,
  selectedSubject,
  selectedGrade,
  selectedTeacher,
  selectedExpertise,
  selectedStudent,
  selectedAcademicPeriod,
  activeTab,
  classes,
  subjects,
  teachers,
  students,
  expertisePrograms,
  academicPeriods,
  filterOptionsLoading,
  visibleFilterIds, // Use this prop
  onDateChange,
  onClassChange,
  onSubjectChange,
  onGradeChange,
  onTeacherChange,
  onExpertiseChange,
  onStudentChange,
  onAcademicPeriodChange,
  onClearFilters,
  getActiveFilterCount
}) => {
  if (!isOpen) return null;

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  // Complete filter configuration - all possible filters
  const allFilterConfig: FilterConfig[] = [
    {
      id: 'dateStart',
      label: 'Tanggal Mulai',
      type: 'date',
      value: dateRange.start,
      onChange: (e) => onDateChange(e as React.ChangeEvent<HTMLInputElement>, 'start'),
      priority: 1
    },
    {
      id: 'dateEnd',
      label: 'Tanggal Akhir',
      type: 'date',
      value: dateRange.end,
      onChange: (e) => onDateChange(e as React.ChangeEvent<HTMLInputElement>, 'end'),
      priority: 2
    },
    {
      id: 'grade',
      label: 'Jenjang',
      type: 'select',
      value: selectedGrade,
      onChange: onGradeChange,
      options: [
        { value: '', label: 'Semua Jenjang' },
        { value: '10', label: 'Kelas 10' },
        { value: '11', label: 'Kelas 11' },
        { value: '12', label: 'Kelas 12' }
      ],
      priority: 3
    },
    {
      id: 'class',
      label: 'Kelas',
      type: 'select',
      value: selectedClass,
      onChange: onClassChange,
      options: [
        { value: '', label: 'Semua Kelas' },
        ...classes.map((classItem) => ({
          value: classItem._id,
          label: `Kelas ${getGradeLabel(classItem.grade_level)} ${classItem.expertise_details?.abbreviation} ${classItem.name}`
        }))
      ],
      priority: 4
    },
    {
      id: 'subject',
      label: 'Mata Pelajaran',
      type: 'select',
      value: selectedSubject,
      onChange: onSubjectChange,
      options: [
        { value: '', label: 'Semua Mata Pelajaran' },
        ...subjects.map((subject) => ({
          value: subject._id,
          label: `${subject.name} (${subject.code})`
        }))
      ],
      priority: 5
    },
    {
      id: 'teacher',
      label: 'Guru',
      type: 'select',
      value: selectedTeacher,
      onChange: onTeacherChange,
      options: [
        { value: '', label: 'Semua Guru' },
        ...teachers.map((teacher) => ({
          value: teacher._id,
          label: teacher.full_name
        }))
      ],
      priority: 6
    },
    {
      id: 'student',
      label: 'Siswa',
      type: 'select',
      value: selectedStudent,
      onChange: onStudentChange,
      options: [
        { value: '', label: 'Semua Siswa' },
        ...students.map((student) => ({
          value: student._id,
          label: student.class_name ? `${student.full_name} (${student.class_name})` : student.full_name
        }))
      ],
      priority: 7
    },
    {
      id: 'academicPeriod',
      label: 'Periode Akademik',
      type: 'select',
      value: selectedAcademicPeriod,
      onChange: onAcademicPeriodChange,
      options: [
        { value: '', label: 'Semua Periode' },
        ...academicPeriods.map((period) => ({
          value: period._id,
          label: `${period.year} - Semester ${period.semester}`
        }))
      ],
      priority: 8
    },
    {
      id: 'expertise',
      label: 'Program Keahlian',
      type: 'select',
      value: selectedExpertise,
      onChange: onExpertiseChange,
      options: [
        { value: '', label: 'Semua Program Keahlian' },
        ...expertisePrograms.map((expertise) => ({
          value: expertise._id,
          label: `${expertise.name} (${expertise.abbreviation})`
        }))
      ],
      priority: 9
    }
  ];

  // Filter logic: if visibleFilterIds is provided and not empty, filter; otherwise show all
  const filtersToDisplay = visibleFilterIds && visibleFilterIds.length > 0
    ? allFilterConfig.filter(filter => visibleFilterIds.includes(filter.id))
    : allFilterConfig;

  // Sort by priority
  const sortedFilters = filtersToDisplay.sort((a, b) => a.priority - b.priority);

  const renderFilterItem = (filter: FilterConfig) => {
    return (
      <div key={filter.id} className="space-y-2">
        {filter.type !== 'checkbox' && (
          <label className="block text-sm font-medium text-gray-700">
            {filter.label}
          </label>
        )}
        {filter.type === 'date' ? (
          <input
            type="date"
            value={filter.value as string}
            onChange={filter.onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        ) : filter.type === 'checkbox' ? (
          <div className="flex items-center">
            <input
              id={filter.id}
              type="checkbox"
              checked={filter.value as boolean}
              onChange={filter.onChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={filter.id} className="ml-2 text-sm text-gray-700 cursor-pointer">
              {filter.label}
            </label>
          </div>
        ) : (
          <select
            value={filter.value as string}
            onChange={filter.onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={filterOptionsLoading}
          >
            {filterOptionsLoading ? (
              <option disabled>Memuat...</option>
            ) : (
              filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Data</h2>
          </div>
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <button
                onClick={onClearFilters}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedFilters.map((filter) => renderFilterItem(filter))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {getActiveFilterCount()} filter aktif
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;