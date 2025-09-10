import React, { useState, useMemo, useCallback } from 'react';
import { Filter, RotateCcw, Target, BookOpen, GraduationCap, Users, MoreHorizontal } from 'lucide-react';
import FilterModal from '@/components/modals/FilterModal';
import AsyncSelect from 'react-select/async';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher, BasicStudent } from '@/types/user';

interface SubjectMasteryFilters {
  dateRange: { start: string; end: string };
  selectedClass: string;
  selectedSubject: string;
  selectedGrade: string;
  selectedExpertise: string;
  selectedStudent: string;
  selectedTeacher: string;
  minExamsPerSubject: number;
  includeZeroScores: boolean;
}

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  students: BasicStudent[];
  expertisePrograms: ExpertiseProgram[];
  academicPeriods: any[];
}

interface SubjectMasteryFilterSectionProps {
  filters: SubjectMasteryFilters;
  onFiltersChange: (filters: SubjectMasteryFilters) => void;
  onClearFilters: () => void;
  filterOptions: FilterOptions;
  filterOptionsLoading: boolean;
  visibleFilterIds?: string[];
  loadStudentOptions?: (inputValue: string, callback: (options: any[]) => void) => void;
  loadTeacherOptions?: (inputValue: string, callback: (options: any[]) => void) => void;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'select' | 'checkbox' | 'async-select';
  value: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: Array<{ value: string; label: string }>;
  loadOptions?: (inputValue: string, callback: (options: any[]) => void) => void;
  priority: number; // Lower number = higher priority (shown first)
}

const SubjectMasteryFilterSection: React.FC<SubjectMasteryFilterSectionProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  filterOptions,
  filterOptionsLoading,
  visibleFilterIds,
  loadStudentOptions,
  loadTeacherOptions
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: e.target.value
      }
    });
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedClass: e.target.value
    });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedSubject: e.target.value
    });
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedGrade: e.target.value
    });
  };

  const handleExpertiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedExpertise: e.target.value
    });
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedStudent: e.target.value
    });
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedTeacher: e.target.value
    });
  };

  const handleMinExamsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      minExamsPerSubject: parseInt(e.target.value)
    });
  };

  const handleIncludeZeroScoresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      includeZeroScores: e.target.checked
    });
  };

  const getGradeLabel = useCallback((gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  }, []);

  // Dynamic filter configuration
  const filterConfig = useMemo((): FilterConfig[] => {
    const config: FilterConfig[] = [
      {
        id: 'dateStart',
        label: 'Tanggal Mulai',
        type: 'date',
        value: filters.dateRange.start,
        onChange: (e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'start'),
        priority: 1
      },
      {
        id: 'dateEnd',
        label: 'Tanggal Akhir',
        type: 'date',
        value: filters.dateRange.end,
        onChange: (e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'end'),
        priority: 2
      },
      {
        id: 'grade',
        label: 'Jenjang',
        type: 'select',
        value: filters.selectedGrade,
        onChange: handleGradeChange,
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
        value: filters.selectedClass,
        onChange: handleClassChange,
        options: [
          { value: '', label: 'Semua Kelas' },
          ...filterOptions.classes.map((classItem) => ({
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
        value: filters.selectedSubject,
        onChange: handleSubjectChange,
        options: [
          { value: '', label: 'Semua Mata Pelajaran' },
          ...filterOptions.subjects.map((subject) => ({
            value: subject._id,
            label: `${subject.name} (${subject.code})`
          }))
        ],
        priority: 5
      },
      {
        id: 'expertise',
        label: 'Program Keahlian',
        type: 'select',
        value: filters.selectedExpertise,
        onChange: handleExpertiseChange,
        options: [
          { value: '', label: 'Semua Program Keahlian' },
          ...filterOptions.expertisePrograms.map((expertise) => ({
            value: expertise._id,
            label: `${expertise.name} (${expertise.abbreviation})`
          }))
        ],
        priority: 6
      },
      {
        id: 'student',
        label: 'Siswa',
        type: 'async-select',
        value: filters.selectedStudent,
        onChange: handleStudentChange,
        loadOptions: loadStudentOptions,
        priority: 7
      },
      {
        id: 'teacher',
        label: 'Guru',
        type: 'async-select',
        value: filters.selectedTeacher,
        onChange: handleTeacherChange,
        loadOptions: loadTeacherOptions,
        priority: 8
      },
      {
        id: 'minExams',
        label: 'Min. Ujian per Mapel',
        type: 'select',
        value: filters.minExamsPerSubject,
        onChange: handleMinExamsChange,
        options: [
          { value: '1', label: 'Minimal 1 ujian' },
          { value: '2', label: 'Minimal 2 ujian' },
          { value: '3', label: 'Minimal 3 ujian' },
          { value: '5', label: 'Minimal 5 ujian' }
        ],
        priority: 9
      },
      {
        id: 'includeZero',
        label: 'Sertakan nilai 0',
        type: 'checkbox',
        value: filters.includeZeroScores,
        onChange: handleIncludeZeroScoresChange,
        priority: 10
      }
    ];

    // Sort by priority
    const sortedConfig = config.sort((a, b) => a.priority - b.priority);
    
    // If visibleFilterIds is provided, only show those filters
    if (visibleFilterIds && visibleFilterIds.length > 0) {
      return sortedConfig.filter(item => visibleFilterIds.includes(item.id));
    }
    
    return sortedConfig;
  }, [
    filters.dateRange.start,
    filters.dateRange.end,
    filters.selectedClass,
    filters.selectedSubject,
    filters.selectedGrade,
    filters.selectedExpertise,
    filters.selectedStudent,
    filters.selectedTeacher,
    filters.minExamsPerSubject,
    filters.includeZeroScores,
    filterOptions.classes,
    filterOptions.subjects,
    filterOptions.expertisePrograms,
    getGradeLabel,
    handleDateChange,
    handleClassChange,
    handleSubjectChange,
    handleGradeChange,
    handleExpertiseChange,
    handleStudentChange,
    handleTeacherChange,
    handleMinExamsChange,
    handleIncludeZeroScoresChange,
    visibleFilterIds
  ]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    
    const defaultStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (filters.dateRange.start !== defaultStart) count++;
    if (filters.dateRange.end !== defaultEnd) count++;
    if (filters.selectedClass) count++;
    if (filters.selectedSubject) count++;
    if (filters.selectedGrade) count++;
    if (filters.selectedExpertise) count++;
    if (filters.selectedStudent) count++;
    if (filters.selectedTeacher) count++;
    if (filters.minExamsPerSubject !== 1) count++;
    if (filters.includeZeroScores !== false) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = useCallback(() => {
    return getActiveFilterCount() > 0;
  }, [getActiveFilterCount]);

  // Render individual filter item
  const renderFilterItem = useCallback((item: FilterConfig) => {
    // Special handling for student and teacher filters with AsyncSelect
    if (item.id === 'student' && loadStudentOptions) {
      return (
        <div key={item.id}>
          <label className="block text-xs text-gray-600 mb-0.5">
            {item.label}
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadStudentOptions}
            value={item.value ? { value: item.value, label: filterOptions.students.find(s => s._id === item.value)?.full_name || item.value } : null}
            onChange={(selectedOption) => {
              const event = {
                target: { value: selectedOption ? selectedOption.value : '' }
              } as React.ChangeEvent<HTMLSelectElement>;
              item.onChange(event);
            }}
            isClearable
            placeholder="Cari siswa..."
            className="text-xs"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '30px',
                fontSize: '12px'
              }),
              option: (provided) => ({
                ...provided,
                fontSize: '12px'
              })
            }}
          />
        </div>
      );
    }

    if (item.id === 'teacher' && loadTeacherOptions) {
      return (
        <div key={item.id}>
          <label className="block text-xs text-gray-600 mb-0.5">
            {item.label}
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadTeacherOptions}
            value={item.value ? { value: item.value, label: filterOptions.teachers.find(t => t._id === item.value)?.full_name || item.value } : null}
            onChange={(selectedOption) => {
              const event = {
                target: { value: selectedOption ? selectedOption.value : '' }
              } as React.ChangeEvent<HTMLSelectElement>;
              item.onChange(event);
            }}
            isClearable
            placeholder="Cari guru..."
            className="text-xs"
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '30px',
                fontSize: '12px'
              }),
              option: (provided) => ({
                ...provided,
                fontSize: '12px'
              })
            }}
          />
        </div>
      );
    }

    return (
      <div key={item.id}>
        {item.type !== 'checkbox' && (
          <label className="block text-xs text-gray-600 mb-0.5">
            {item.label}
          </label>
        )}
        {item.type === 'date' ? (
          <input
            type="date"
            value={item.value as string}
            onChange={item.onChange}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        ) : item.type === 'checkbox' ? (
          <div className="flex items-center h-full">
            <input
              id={item.id}
              type="checkbox"
              checked={item.value as boolean}
              onChange={item.onChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor={item.id} className="ml-2 text-sm text-gray-700 cursor-pointer">
              {item.label}
            </label>
          </div>
        ) : (
          <select
            value={item.value as string}
            onChange={item.onChange}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            disabled={filterOptionsLoading}
          >
            {filterOptionsLoading ? (
              <option disabled>Memuat...</option>
            ) : (
              item.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        )}
      </div>
    );
  }, [filterOptionsLoading]);

  // Determine how many filters to show directly based on total count and available space
  const maxDirectFilters = filterConfig.length <= 6 ? filterConfig.length : 4;
  const visibleFilters = filterConfig.slice(0, maxDirectFilters);
  const hiddenFiltersCount = Math.max(0, filterConfig.length - maxDirectFilters);

  return (
    <>

      {/* Desktop Filters - Responsive */}
      <div className="hidden md:block bg-white shadow-sm rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Filter Penguasaan Mata Pelajaran</h3>
          {hasActiveFilters() && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{getActiveFilterCount()} filter aktif</span>
              <button
                onClick={onClearFilters}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        
        {/* Dynamic Filter Layout */}
        <div className="flex items-end space-x-3">
          {/* Display visible filters */}
          {visibleFilters.map((filter) => (
            <div key={filter.id} className="flex-1">
              {renderFilterItem(filter)}
            </div>
          ))}
          
          {/* More Button - Only show if there are hidden filters */}
          {hiddenFiltersCount > 0 && (
            <div className="flex-1">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="w-full h-[38px] flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title={`${hiddenFiltersCount} filter tambahan`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>More</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {hiddenFiltersCount}
                </span>
              </button>
            </div>
          )}
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
          <span className="text-sm font-medium text-gray-700">Filter Penguasaan Mata Pelajaran</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        dateRange={filters.dateRange}
        selectedClass={filters.selectedClass}
        selectedSubject={filters.selectedSubject}
        selectedGrade={filters.selectedGrade}
        selectedTeacher={filters.selectedTeacher}
        selectedExpertise={filters.selectedExpertise}
        selectedStudent={filters.selectedStudent}
        selectedAcademicPeriod=""
        activeTab="subject-mastery"
        classes={filterOptions.classes}
        subjects={filterOptions.subjects}
        teachers={filterOptions.teachers}
        students={filterOptions.students}
        academicPeriods={filterOptions.academicPeriods}
        expertisePrograms={filterOptions.expertisePrograms}
        filterOptionsLoading={filterOptionsLoading}
        visibleFilterIds={visibleFilterIds}
        onDateChange={handleDateChange}
        onClassChange={handleClassChange}
        onSubjectChange={handleSubjectChange}
        onGradeChange={handleGradeChange}
        onTeacherChange={handleTeacherChange}
        onExpertiseChange={handleExpertiseChange}
        onStudentChange={handleStudentChange}
        onAcademicPeriodChange={() => {}} // Not used for subject mastery
        onClearFilters={onClearFilters}
        getActiveFilterCount={getActiveFilterCount}
        loadStudentOptions={loadStudentOptions}
        loadTeacherOptions={loadTeacherOptions}
      />
    </>
  );
};

export default SubjectMasteryFilterSection;