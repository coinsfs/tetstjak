import React, { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { ExpertiseProgramFilters } from '@/types/expertise';

interface ExpertiseProgramFilterProps {
  filters: ExpertiseProgramFilters;
  onFiltersChange: (filters: ExpertiseProgramFilters) => void;
  onResetFilters: () => void;
}

const ExpertiseProgramFilter: React.FC<ExpertiseProgramFilterProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');

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
  }, [searchValue, filters, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Jurusan</h3>
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
        {/* Search Input - Always available */}
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">
            Pencarian
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau singkatan jurusan..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {filters.search && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Filter aktif:</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                Pencarian: "{filters.search}"
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertiseProgramFilter;