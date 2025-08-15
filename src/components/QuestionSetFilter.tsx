import React, { useState, useEffect } from 'react';
import { QuestionSetFilters } from '@/types/questionSet';
import { useAuth } from '@/contexts/AuthContext';
import { subjectService } from '@/services/subject';
import { userService } from '@/services/user';
import { Subject } from '@/types/subject';
import { Teacher } from '@/types/user';
import { Search, Filter, RotateCcw, ChevronDown } from 'lucide-react';

interface QuestionSetFilterProps {
  filters: QuestionSetFilters;
  onFiltersChange: (filters: QuestionSetFilters) => void;
  onResetFilters: () => void;
}

const QuestionSetFilter: React.FC<QuestionSetFilterProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load subjects and teachers for filter options
  useEffect(() => {
    const loadFilterData = async () => {
      if (!token) return;

      try {
        const [subjectsResponse, teachersResponse] = await Promise.all([
          subjectService.getSubjects(token, { limit: 1000 }),
          userService.getTeachers(token, { limit: 1000 })
        ]);

        setSubjects(subjectsResponse.data || []);
        setTeachers(teachersResponse.data || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadFilterData();
  }, [token]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search || '')) {
        onFiltersChange({
          ...filters,
          search: searchValue || undefined
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  const handleFilterChange = (key: keyof QuestionSetFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'page' && key !== 'limit' && filters[key as keyof QuestionSetFilters] !== undefined
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Filter Aktif
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span>{isExpanded ? 'Sembunyikan' : 'Tampilkan'} Filter</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search Input - Always visible */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pencarian
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama paket soal..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            />
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mata Pelajaran
              </label>
              <select
                value={filters.subject_id || ''}
                onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tingkat Kelas
              </label>
              <select
                value={filters.grade_level || ''}
                onChange={(e) => handleFilterChange('grade_level', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Semua Tingkat</option>
                <option value="10">Kelas X</option>
                <option value="11">Kelas XI</option>
                <option value="12">Kelas XII</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Public/Private Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Visibilitas
              </label>
              <select
                value={filters.is_public !== undefined ? filters.is_public.toString() : ''}
                onChange={(e) => handleFilterChange('is_public', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Semua</option>
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </div>

            {/* Created By Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Dibuat Oleh
              </label>
              <select
                value={filters.created_by || ''}
                onChange={(e) => handleFilterChange('created_by', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Semua Guru</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.profile_details?.full_name || teacher.login_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionSetFilter;