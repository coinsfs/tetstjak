import React, { useState, useRef, useEffect } from 'react';
import { Filter, RotateCcw, Target, BookOpen, GraduationCap, Users, MoreHorizontal } from 'lucide-react';
import FilterModal from '@/components/modals/FilterModal';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher } from '@/types/user';

interface SubjectMasteryFilters {
  dateRange: { start: string; end: string };
  selectedClass: string;
  selectedSubject: string;
  selectedGrade: string;
  selectedExpertise: string;
  minExamsPerSubject: number;
  includeZeroScores: boolean;
}

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  expertisePrograms: ExpertiseProgram[];
}

interface SubjectMasteryFilterSectionProps {
  filters: SubjectMasteryFilters;
  onFiltersChange: (filters: SubjectMasteryFilters) => void;
  onClearFilters: () => void;
  filterOptions: FilterOptions;
  filterOptionsLoading: boolean;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'select' | 'checkbox';
  value: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: Array<{ value: string; label: string }>;
  priority: number; // Lower number = higher priority (shown first)
}

const SubjectMasteryFilterSection: React.FC<SubjectMasteryFilterSectionProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  filterOptions,
  filterOptionsLoading
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [visibleFilters, setVisibleFilters] = useState<string[]>([]);
  const [hiddenFilters, setHiddenFilters] = useState<string[]>([]);
  
  // Refs for measurement
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

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
        priority: 7
      },
      {
        id: 'includeZero',
        label: 'Sertakan nilai 0',
        type: 'checkbox',
        value: filters.includeZeroScores,
        onChange: handleIncludeZeroScoresChange,
        priority: 8
      }
    ];

    // Sort by priority
    return config.sort((a, b) => a.priority - b.priority);
  };

  // Measure filter dimensions and determine visibility
  useEffect(() => {
    const measureFilters = () => {
      if (!filterContainerRef.current) return;

      const containerWidth = filterContainerRef.current.offsetWidth;
      const moreButtonWidth = moreButtonRef.current?.offsetWidth || 80; // Estimate if not rendered
      const availableWidth = containerWidth - moreButtonWidth - 32; // Account for padding and gaps

      console.log('📏 Subject Mastery Filter Container Measurements:', {
        containerWidth,
        moreButtonWidth,
        availableWidth
      });

      let accumulatedWidth = 0;
      const visible: string[] = [];
      const hidden: string[] = [];
      const filterConfig = getFilterConfig();

      filterConfig.forEach((filter, index) => {
        const filterElement = filterItemRefs.current[index];
        if (filterElement) {
          const filterWidth = filterElement.offsetWidth + 12; // Add gap
          console.log(`📏 Subject Mastery Filter ${filter.id} width:`, filterWidth);

          if (accumulatedWidth + filterWidth <= availableWidth) {
            visible.push(filter.id);
            accumulatedWidth += filterWidth;
          } else {
            hidden.push(filter.id);
          }
        }
      });

      console.log('📏 Subject Mastery Filter Visibility:', { visible, hidden });
      setVisibleFilters(visible);
      setHiddenFilters(hidden);
    };

    // Measure after initial render
    const timer = setTimeout(measureFilters, 100);

    // Re-measure on window resize
    const handleResize = () => {
      measureFilters();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [filters, filterOptions, filterOptionsLoading]);

  const getActiveFilterCount = () => {
    let count = 0;
    
    const defaultStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (filters.dateRange.start !== defaultStart) count++;
    if (filters.dateRange.end !== defaultEnd) count++;
    if (filters.selectedClass) count++;
    if (filters.selectedSubject) count++;
    if (filters.selectedGrade) count++;
    if (filters.selectedExpertise) count++;
    if (filters.minExamsPerSubject !== 1) count++;
    if (filters.includeZeroScores !== false) count++;
    return count;
  };

  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  // Render individual filter item
  const renderFilterItem = (filter: FilterConfig, index: number) => {
    return (
      <div
        key={filter.id}
        ref={(el) => (filterItemRefs.current[index] = el)}
        className="flex-grow basis-0 min-w-[140px]"
      >
        <label className="block text-xs text-gray-600 mb-1">
          {filter.label}
        </label>
        {filter.type === 'date' ? (
          <input
            type="date"
            value={filter.value as string}
            onChange={filter.onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        ) : filter.type === 'checkbox' ? (
          <label className="flex items-center space-x-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={filter.value as boolean}
              onChange={filter.onChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">{filter.label}</span>
          </label>
        ) : (
          <select
            value={filter.value as string}
            onChange={filter.onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Penguasaan Mata Pelajaran</h2>
            <p className="text-sm text-gray-600">Analisis penguasaan siswa per mata pelajaran</p>
          </div>
        </div>
      </div>

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
        
        {/* Dynamic Filter Container */}
        <div 
          ref={filterContainerRef}
          className="flex items-end space-x-3 overflow-hidden"
        >
          {/* Visible Filters */}
          {filterConfig.map((filter, index) => {
            const isVisible = visibleFilters.length === 0 || visibleFilters.includes(filter.id);
            
            return (
              <div
                key={filter.id}
                className={`transition-all duration-300 ${
                  isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 w-0 overflow-hidden'
                }`}
                style={{ display: isVisible ? 'block' : 'none' }}
              >
                {renderFilterItem(filter, index)}
              </div>
            );
          })}

          {/* More Button - Show when there are hidden filters */}
          {hiddenFilters.length > 0 && (
            <button
              ref={moreButtonRef}
              onClick={() => setIsFilterModalOpen(true)}
              className="flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title={`${hiddenFilters.length} filter tersembunyi`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
              {hiddenFilters.length > 0 && (
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {hiddenFilters.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Debug Info - Development Only */}
        {import.meta.env.DEV && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
            <div>Container Width: {filterContainerRef.current?.offsetWidth || 'measuring...'}px</div>
            <div>Visible Filters: {visibleFilters.join(', ') || 'all'}</div>
            <div>Hidden Filters: {hiddenFilters.join(', ') || 'none'}</div>
          </div>
        )}
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
        selectedTeacher=""
        selectedExpertise={filters.selectedExpertise}
        activeTab="subject-mastery"
        classes={filterOptions.classes}
        subjects={filterOptions.subjects}
        teachers={filterOptions.teachers}
        expertisePrograms={filterOptions.expertisePrograms}
        filterOptionsLoading={filterOptionsLoading}
        onDateChange={handleDateChange}
        onClassChange={handleClassChange}
        onSubjectChange={handleSubjectChange}
        onGradeChange={handleGradeChange}
        onTeacherChange={() => {}} // Not used for subject mastery
        onExpertiseChange={handleExpertiseChange}
        onClearFilters={onClearFilters}
        getActiveFilterCount={getActiveFilterCount}
      />
    </>
  );
};

export default SubjectMasteryFilterSection;