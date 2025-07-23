import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { TeacherFilters } from '@/types/user';
import { userService } from '@/services/user';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherFilterProps {
  filters: TeacherFilters;
  onFiltersChange: (filters: TeacherFilters) => void;
  onResetFilters: () => void;
}

interface DepartmentData {
  _id: string;
  name: string;
  abbreviation: string;
}

interface ClassData {
  _id: string;
  name: string;
  grade_level: number;
  expertise_id: string;
  expertise_details: {
    name: string;
    abbreviation: string;
  };
}

const TeacherFilter: React.FC<TeacherFilterProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setDepartmentsLoading(true);
        const departmentData = await userService.getDepartments(token);
        setDepartments(departmentData);
      } catch (error) {
        console.error('Error fetching filter data:', error);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchData();
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
  }, [searchValue, filters, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: keyof TeacherFilters, value: string) => {
    const newFilters = { ...filters };
    
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }

    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Memoize active filters to prevent unnecessary re-renders
  const activeFiltersDisplay = useMemo(() => {
    if (!(filters.search || filters.expertise_id)) {
      return null;
    }

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">Filter aktif:</span>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                Pencarian: "{filters.search}"
              </span>
            )}
            {filters.expertise_id && filters.expertise_id !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                Jurusan: {departments.find(d => d._id === filters.expertise_id)?.abbreviation}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [filters, departments]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Guru</h3>
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
        <div className="space-y-2 flex-1 min-w-[200px] max-w-[70%]">
          <label className="block text-sm font-medium text-gray-700">
            Pencarian
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NKTAM..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Department Filter - Show immediately with loading state */}
        <div className="space-y-2 flex-1 min-w-[150px] max-w-[30%]">
          <label className="block text-sm font-medium text-gray-700">
            Jurusan
          </label>
          <select
            value={filters.expertise_id || 'all'}
            onChange={(e) => handleFilterChange('expertise_id', e.target.value)}
            disabled={departmentsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="all">
              {departmentsLoading ? 'Memuat jurusan...' : 'Semua Jurusan'}
            </option>
            {!departmentsLoading && departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.abbreviation} - {department.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.expertise_id) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Filter aktif:</span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  Pencarian: "{filters.search}"
                </span>
              )}
              {filters.expertise_id && filters.expertise_id !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                  Jurusan: {departmentsLoading ? 'Memuat...' : departments.find(d => d._id === filters.expertise_id)?.abbreviation}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherFilter;