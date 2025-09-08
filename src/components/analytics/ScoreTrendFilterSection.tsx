import React, { useState } from 'react';
import { Filter, RotateCcw, BarChart3, Users, BookOpen, GraduationCap } from 'lucide-react';
import FilterModal from '@/components/modals/FilterModal';
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
  activeTab: string;
}

interface FilterOptions {
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  expertisePrograms: ExpertiseProgram[];
}

interface ScoreTrendFilterSectionProps {
  filters: ScoreTrendFilters;
  onFiltersChange: (filters: ScoreTrendFilters) => void;
  filterOptions: FilterOptions;
  filterOptionsLoading: boolean;
  onClearFilters: () => void;
}

const ScoreTrendFilterSection: React.FC<ScoreTrendFilterSectionProps> = ({
  filters,
  onFiltersChange,
  filterOptions,
  filterOptionsLoading,
  onClearFilters
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
    return count;
  };

  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

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

      {/* Desktop Filters */}
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
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
              value={filters.dateRange.end}
              onChange={(e) => handleDateChange(e, 'end')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Kelas
            </label>
            <select
              value={filters.selectedClass}
              onChange={handleClassChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {filterOptions.classes.map((classItem) => (
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
              value={filters.selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Mata Pelajaran</option>
              {filterOptions.subjects.map((subject) => (
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
              value={filters.selectedGrade}
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
          {filters.activeTab === 'teacher' && (
            <div className="col-span-full sm:col-span-1">
              <label className="block text-xs text-gray-600 mb-1">
                Guru
              </label>
              <select
                value={filters.selectedTeacher}
                onChange={handleTeacherChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={filterOptionsLoading}
              >
                <option value="">Semua Guru</option>
                {filterOptions.teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.full_name}
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
              value={filters.selectedExpertise}
              onChange={handleExpertiseChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={filterOptionsLoading}
            >
              <option value="">Semua Program Keahlian</option>
              {filterOptionsLoading ? (
                <option disabled>Memuat...</option>
              ) : (
                filterOptions.expertisePrograms.map((expertise) => (
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
        onDateChange={handleDateChange}
        onClassChange={handleClassChange}
        onSubjectChange={handleSubjectChange}
        onGradeChange={handleGradeChange}
        onTeacherChange={handleTeacherChange}
        onExpertiseChange={handleExpertiseChange}
        onClearFilters={onClearFilters}
        getActiveFilterCount={getActiveFilterCount}
      />
    </>
  );
};

export default ScoreTrendFilterSection;