import React, { memo } from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { QuestionSubmissionFilters, AcademicPeriod } from '@/services/questionSubmission';

type QuestionSource = 'my_questions' | 'my_submissions';

interface QuestionFilters {
  search?: string;
  difficulty?: string;
  question_type?: string;
  purpose?: string;
  include_submitted?: boolean;
  include_approved?: boolean;
  page: number;
  limit: number;
}

interface QuestionFiltersProps {
  filters: QuestionFilters & QuestionSubmissionFilters;
  questionSource: QuestionSource;
  academicPeriods: AcademicPeriod[];
  onFilterChange: (key: keyof QuestionFilters, value: any) => void;
  onResetFilters: () => void;
}

const QuestionFiltersComponent: React.FC<QuestionFiltersProps> = ({
  filters,
  questionSource,
  academicPeriods,
  onFilterChange,
  onResetFilters
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Pilihan Ganda';
      case 'essay': return 'Essay';
      default: return type;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Mudah';
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      default: return difficulty;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Filter Soal</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari soal atau tag..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
          />
        </div>

        {/* Question Type Filter */}
        <select
          value={filters.question_type}
          onChange={(e) => onFilterChange('question_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
        >
          <option value="">Semua Tipe Soal</option>
          <option value="multiple_choice">Pilihan Ganda</option>
          <option value="essay">Essay</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={filters.difficulty}
          onChange={(e) => onFilterChange('difficulty', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
        >
          <option value="">Semua Tingkat</option>
          <option value="easy">Mudah</option>
          <option value="medium">Sedang</option>
          <option value="hard">Sulit</option>
        </select>

        {/* Additional filters for my submissions */}
        {questionSource === 'my_submissions' && (
          <>
            {/* Academic Period Filter */}
            <select
              value={filters.academic_period_id}
              onChange={(e) => onFilterChange('academic_period_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
            >
              <option value="">Semua Periode</option>
              {academicPeriods.map((period) => (
                <option key={period._id} value={period._id}>
                  {period.year} - {period.semester} {period.status === 'active' ? '(Aktif)' : ''}
                </option>
              ))}
            </select>

            {/* Purpose Filter */}
            <input
              type="text"
              placeholder="Tujuan..."
              value={filters.purpose}
              onChange={(e) => onFilterChange('purpose', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
            />

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
            >
              <option value="">Semua Status</option>
              <option value="submitted">Disubmit</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </>
        )}

        {/* Reset Button */}
        {questionSource === 'my_questions' && (
          <button
            onClick={onResetFilters}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>
      
      {/* Active Filters Display */}
      {(filters.search || filters.difficulty || filters.question_type || 
        (questionSource === 'my_submissions' && (filters.purpose || filters.academic_period_id || filters.status))) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Filter aktif:</span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Pencarian: "{filters.search}"
                </span>
              )}
              {filters.difficulty && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Tingkat: {getDifficultyLabel(filters.difficulty)}
                </span>
              )}
              {filters.question_type && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Tipe: {getTypeLabel(filters.question_type)}
                </span>
              )}
              {questionSource === 'my_submissions' && filters.purpose && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Tujuan: "{filters.purpose}"
                </span>
              )}
              {questionSource === 'my_submissions' && filters.academic_period_id && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Periode: {academicPeriods.find(p => p._id === filters.academic_period_id)?.year} - {academicPeriods.find(p => p._id === filters.academic_period_id)?.semester}
                </span>
              )}
              {questionSource === 'my_submissions' && filters.status && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  Status: {filters.status === 'submitted' ? 'Disubmit' : filters.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

QuestionFiltersComponent.displayName = 'QuestionFiltersComponent';

export default QuestionFiltersComponent;