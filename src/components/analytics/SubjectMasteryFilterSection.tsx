import React, { useState } from 'react';
import { Filter, RotateCcw, Target, BookOpen, GraduationCap, Users } from 'lucide-react';
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

      {/* Desktop Filters */}
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateChange(e, 'start')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Kelas
            </label>
            <select
              value={filters.selectedClass}
              onChange={handleClassChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              disabled={filterOptionsLoading}
            >
              <option value="">Semua Kelas</option>
              {filterOptionsLoading ? (
                <option disabled>Memuat...</option>
              ) : (
                filterOptions.classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    Kelas {getGradeLabel(classItem.grade_level)} {classItem.expertise_details?.abbreviation} {classItem.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={filters.selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              disabled={filterOptionsLoading}
            >
              <option value="">Semua Mata Pelajaran</option>
              {filterOptionsLoading ? (
                <option disabled>Memuat...</option>
              ) : (
                filterOptions.subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Jenjang
            </label>
            <select
              value={filters.selectedGrade}
              onChange={handleGradeChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Semua Jenjang</option>
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Program Keahlian
            </label>
            <select
              value={filters.selectedExpertise}
              onChange={handleExpertiseChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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

          {/* Subject Mastery Specific Filters */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Min. Ujian per Mapel
            </label>
            <select
              value={filters.minExamsPerSubject}
              onChange={handleMinExamsChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="1">Minimal 1 ujian</option>
              <option value="2">Minimal 2 ujian</option>
              <option value="3">Minimal 3 ujian</option>
              <option value="5">Minimal 5 ujian</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeZeroScores}
                onChange={handleIncludeZeroScoresChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-xs text-gray-700">Sertakan nilai 0</span>
            </label>
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