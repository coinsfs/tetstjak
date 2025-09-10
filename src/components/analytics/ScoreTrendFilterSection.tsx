import React, { useState, useRef, useEffect } from 'react';
import { Filter, BarChart3, Users, BookOpen, GraduationCap, MoreHorizontal } from 'lucide-react';
import FilterModal from '@/components/modals/FilterModal';
import AsyncSelect from 'react-select/async';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher } from '@/types/user';

interface ScoreTrendFilters {
  dateRange: { start: string; end: string };
  selectedClass: string;
  selectedSubject: string;
  selectedGrade: string;
  selectedTeacher: string;
  selectedExpertise: string;
  selectedStudent: string;
  selectedAcademicPeriod: string;
  activeTab: string;
}

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  students: BasicStudent[];
  expertisePrograms: ExpertiseProgram[];
  academicPeriods: AcademicPeriod[];
}

interface ScoreTrendFilterSectionProps {
  filters: ScoreTrendFilters;
  onFiltersChange: (filters: ScoreTrendFilters) => void;
  filterOptions: FilterOptions;
  filterOptionsLoading: boolean;
  onClearFilters: () => void;
  visibleFilterIds?: string[];
  loadStudentOptions?: (inputValue: string, callback: (options: any[]) => void) => void;
  loadTeacherOptions?: (inputValue: string, callback: (options: any[]) => void) => void;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: Array<{ value: string; label: string }>;
  hidden?: boolean;
  priority: number; // Lower number = higher priority (shown first)
}

const ScoreTrendFilterSection: React.FC<ScoreTrendFilterSectionProps> = ({
  filters,
  onFiltersChange,
  filterOptions,
  filterOptionsLoading,
  onClearFilters,
  visibleFilterIds,
  loadStudentOptions,
  loadTeacherOptions
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Keseluruhan', icon: BarChart3 },
    { id: 'class', label: 'Kelas', icon: Users },
    { id: 'subject', label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'grade', label: 'Jenjang', icon: GraduationCap },
    { id: 'teacher', label: 'Guru', icon: Users }
  ];

  const handleActiveTabChange = (tab: string) => {
    onFiltersChange({
      ...filters,
      activeTab: tab
    });
  };

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

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedTeacher: e.target.value
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

  const handleAcademicPeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      selectedAcademicPeriod: e.target.value
    });
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  // Dynamic filter configuration
  const getFilterConfig = (): FilterConfig[] => {
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
        id: 'teacher',
        label: 'Guru',
        type: 'select',
        value: filters.selectedTeacher,
        onChange: handleTeacherChange,
        options: [
          { value: '', label: 'Semua Guru' },
          ...filterOptions.teachers.map((teacher) => ({
            value: teacher._id,
            label: teacher.full_name
          }))
        ],
        hidden: filters.activeTab !== 'teacher',
        priority: 6
      },
      {
        id: 'student',
        label: 'Siswa',
        type: 'select',
        value: filters.selectedStudent,
        onChange: handleStudentChange,
        options: [
          { value: '', label: 'Semua Siswa' },
          ...filterOptions.students.map((student) => ({
            value: student._id,
            label: student.full_name + (student.class_name ? ` (${student.class_name})` : '')
          }))
        ],
        priority: 7
      },
      {
        id: 'academicPeriod',
        label: 'Periode Akademik',
        type: 'select',
        value: filters.selectedAcademicPeriod,
        onChange: handleAcademicPeriodChange,
        options: [
          { value: '', label: 'Semua Periode' },
          ...filterOptions.academicPeriods.map((period) => ({
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
        value: filters.selectedExpertise,
        onChange: handleExpertiseChange,
        options: [
          { value: '', label: 'Semua Program Keahlian' },
          ...filterOptions.expertisePrograms.map((expertise) => ({
            value: expertise._id,
            label: `${expertise.name} (${expertise.abbreviation})`
          }))
        ],
        priority: 9
      }
    ];

    // Filter out hidden items and sort by priority
    const filteredConfig = config.filter(item => !item.hidden);
    
    // If visibleFilterIds is provided, only show those filters
    if (visibleFilterIds && visibleFilterIds.length > 0) {
      return filteredConfig
        .filter(item => visibleFilterIds.includes(item.id))
        .sort((a, b) => a.priority - b.priority);
    }
    
    return filteredConfig.sort((a, b) => a.priority - b.priority);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    
    const defaultStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (filters.dateRange.start !== defaultStart) count++;
    if (filters.dateRange.end !== defaultEnd) count++;
    if (filters.selectedClass) count++;
    if (filters.selectedSubject) count++;
    if (filters.selectedGrade) count++;
    if (filters.selectedTeacher) count++;
    if (filters.selectedExpertise) count++;
    if (filters.selectedStudent) count++;
    if (filters.selectedAcademicPeriod) count++;
    return count;
  };

  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  // Render individual filter item
  const renderFilterItem = (filter: FilterConfig) => {
    // Special handling for student and teacher filters with AsyncSelect
    if (filter.id === 'student' && loadStudentOptions) {
      return (
        <div key={filter.id} className="flex-1">
          <label className="block text-xs text-gray-600 mb-0.5">
            {filter.label}
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadStudentOptions}
            value={filter.value ? { value: filter.value, label: filterOptions.students.find(s => s._id === filter.value)?.full_name || filter.value } : null}
            onChange={(selectedOption) => {
              const event = {
                target: { value: selectedOption ? selectedOption.value : '' }
              } as React.ChangeEvent<HTMLSelectElement>;
              filter.onChange(event);
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

    if (filter.id === 'teacher' && loadTeacherOptions) {
      return (
        <div key={filter.id} className="flex-1">
          <label className="block text-xs text-gray-600 mb-0.5">
            {filter.label}
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadTeacherOptions}
            value={filter.value ? { value: filter.value, label: filterOptions.teachers.find(t => t._id === filter.value)?.full_name || filter.value } : null}
            onChange={(selectedOption) => {
              const event = {
                target: { value: selectedOption ? selectedOption.value : '' }
              } as React.ChangeEvent<HTMLSelectElement>;
              filter.onChange(event);
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
      <div
        key={filter.id}
        className="flex-1"
      >
        <label className="block text-xs text-gray-600 mb-0.5">
          {filter.label}
        </label>
        {filter.type === 'date' ? (
          <input
            type="date"
            value={filter.value as string}
            onChange={filter.onChange}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <select
            value={filter.value as string}
            onChange={filter.onChange}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

  const filterConfig = getFilterConfig();
  
  // Determine how many filters to show directly based on total count
  const maxDirectFilters = filterConfig.length <= 5 ? filterConfig.length : 4;
  const visibleFilters = filterConfig.slice(0, maxDirectFilters);
  const hiddenFiltersCount = Math.max(0, filterConfig.length - maxDirectFilters);

  return (
    <>
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <nav className="flex overflow-x-auto scrollbar-hide border-b border-gray-200" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = filters.activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleActiveTabChange(tab.id)}
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

      {/* Desktop Filters - Responsive */}
      <div className="hidden md:block bg-white shadow-sm rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Filter</h3>
          {hasActiveFilters() && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{getActiveFilterCount()} filter aktif</span>
              <button
                onClick={onClearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        
        {/* Dynamic Filter Container */}
        <div className="flex items-end space-x-3">
          {/* Display first 4 filters */}
          {visibleFilters.map((filter) => renderFilterItem(filter))}

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
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
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
          <span className="text-sm font-medium text-gray-700">Filter Data</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
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
        activeTab={filters.activeTab}
        classes={filterOptions.classes}
        subjects={filterOptions.subjects}
        teachers={filterOptions.teachers}
        expertisePrograms={filterOptions.expertisePrograms}
        filterOptionsLoading={filterOptionsLoading}
        visibleFilterIds={visibleFilterIds}
        onDateChange={handleDateChange}
        onClassChange={handleClassChange}
        onSubjectChange={handleSubjectChange}
        onGradeChange={handleGradeChange}
        onTeacherChange={handleTeacherChange}
        onExpertiseChange={handleExpertiseChange}
        onClearFilters={onClearFilters}
        getActiveFilterCount={getActiveFilterCount}
        selectedStudent={filters.selectedStudent}
        selectedAcademicPeriod={filters.selectedAcademicPeriod}
        students={filterOptions.students}
        academicPeriods={filterOptions.academicPeriods}
        onStudentChange={handleStudentChange}
        onAcademicPeriodChange={handleAcademicPeriodChange}
        loadStudentOptions={loadStudentOptions}
        loadTeacherOptions={loadTeacherOptions}
      />
    </>
  );
};

export default ScoreTrendFilterSection;