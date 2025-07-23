import React, { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { ClassFilters } from '@/types/class';
import { ExpertiseProgram } from '@/types/common';
import { classService } from '@/services/class';
import { useAuth } from '@/contexts/AuthContext';

interface ClassFilterProps {
  filters: ClassFilters;
  onFiltersChange: (filters: ClassFilters) => void;
  onResetFilters: () => void;
}

const ClassFilter: React.FC<ClassFilterProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const { token } = useAuth();
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [expertiseProgramsLoading, setExpertiseProgramsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const fetchExpertisePrograms = async () => {
      if (!token) return;

      try {
        setExpertiseProgramsLoading(true);
        const data = await classService.getExpertisePrograms(token);
        setExpertisePrograms(data);
      } catch (error) {
        console.error('Error fetching expertise programs:', error);
      } finally {
        setExpertiseProgramsLoading(false);
      }
    };

    fetchExpertisePrograms();
  }, [token]);

  // Update search value when filters change externally (like reset)
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

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
  }, [searchValue]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: keyof ClassFilters, value: string) => {
    const newFilters = { ...filters };
    
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Generate academic years (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    academicYears.push(`${i}/${i + 1}`);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Kelas</h3>
        </div>
        
        <button
          onClick={onResetFilters}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Filter</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
  {(() => {
    const activeFilters = [];

    // grade level filter is always shown
    activeFilters.push(
      <div key="grade" className="min-w-[150px] basis-[var(--filter-basis)] grow-0">
        <label className="block text-sm font-medium text-gray-700">
          Tingkat Kelas
        </label>
        <select
          value={filters.grade_level || 'all'}
          onChange={(e) => handleFilterChange('grade_level', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="all">Semua Tingkat</option>
          <option value="10">Kelas X</option>
          <option value="11">Kelas XI</option>
          <option value="12">Kelas XII</option>
        </select>
      </div>
    );

    if (expertisePrograms.length > 0) {
      activeFilters.push(
        <div key="expertise" className="min-w-[150px] basis-[var(--filter-basis)] grow-0">
          <label className="block text-sm font-medium text-gray-700">
            Jurusan
          </label>
          <select
            value={filters.expertise_id || 'all'}
            onChange={(e) => handleFilterChange('expertise_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">Semua Jurusan</option>
            {expertisePrograms.map((exp) => (
              <option key={exp._id} value={exp._id}>
                {exp.abbreviation} - {exp.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    activeFilters.push(
      <div key="academic" className="min-w-[150px] basis-[var(--filter-basis)] grow-0">
        <label className="block text-sm font-medium text-gray-700">
          Tahun Ajaran
        </label>
        <select
          value={filters.academic_year || 'all'}
          onChange={(e) => handleFilterChange('academic_year', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="all">Semua Tahun</option>
          {academicYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    );

    const filterCount = activeFilters.length;
    const searchBasis = filterCount === 1 ? '70%' :
                        filterCount === 2 ? '40%' :
                        filterCount === 3 ? '25%' : '100%';
    const filterBasis = filterCount === 1 ? '30%' :
                        filterCount === 2 ? '30%' :
                        filterCount === 3 ? '25%' : '0%';

    return (
      <>
        {/* Set CSS variables dynamically */}
        <style>
          {`:root {
              --filter-basis: ${filterBasis};
            }`}
        </style>

        {activeFilters}

        {/* Search - Always available */}
        <div className="min-w-[200px]" style={{ flexBasis: searchBasis }}>
          <label className="block text-sm font-medium text-gray-700">Pencarian</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama kelas..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Expertise Program Filter - Show immediately with loading state */}
        <div className="min-w-[150px] basis-[var(--filter-basis)] grow-0">
          <label className="block text-sm font-medium text-gray-700">
            Jurusan
          </label>
          <select
            value={filters.expertise_id || 'all'}
            onChange={(e) => handleFilterChange('expertise_id', e.target.value)}
            disabled={expertiseProgramsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="all">
              {expertiseProgramsLoading ? 'Memuat jurusan...' : 'Semua Jurusan'}
            </option>
            {!expertiseProgramsLoading && expertisePrograms.map((exp) => (
              <option key={exp._id} value={exp._id}>
                {exp.abbreviation} - {exp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year Filter - Always available */}
        <div className="min-w-[150px] basis-[var(--filter-basis)] grow-0">
          <label className="block text-sm font-medium text-gray-700">
            Tahun Ajaran
          </label>
          <select
            value={filters.academic_year || 'all'}
            onChange={(e) => handleFilterChange('academic_year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">Semua Tahun</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </>
    );
  })()}
</div>


      {/* Active Filters Display */}
      {(filters.search || filters.grade_level || filters.expertise_id || filters.academic_year) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Filter aktif:</span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  Pencarian: "{filters.search}"
                </span>
              )}
              {filters.grade_level && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                  Kelas: {filters.grade_level === '10' ? 'X' : filters.grade_level === '11' ? 'XI' : 'XII'}
                </span>
              )}
              {filters.expertise_id && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                  Jurusan: {expertisePrograms.find(e => e._id === filters.expertise_id)?.abbreviation}
                </span>
              )}
              {filters.academic_year && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">
                  TA: {filters.academic_year}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassFilter;