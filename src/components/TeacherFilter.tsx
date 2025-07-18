import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { TeacherFilters } from '../types/teacher';
import { teacherService } from '../services/teacherService';
import { useAuth } from '../contexts/AuthContext';

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

const TeacherFilter: React.FC<TeacherFilterProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!token) return;

      try {
        const departmentData = await teacherService.getDepartments(token);
        setDepartments(departmentData);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, [token]);

  // Update search value when filters change externally (like reset)
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    onFiltersChange({
      ...filters,
      search: value || undefined
    });
  }, [filters, onFiltersChange]);

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
    if (!(filters.search || filters.department || filters.status || filters.onboarding)) {
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
            {filters.department && filters.department !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                Jurusan: {departments.find(d => d._id === filters.department)?.abbreviation}
              </span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                Status: {filters.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            )}
            {filters.onboarding && filters.onboarding !== 'all' && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">
                Onboarding: {filters.onboarding === 'completed' ? 'Selesai' : 'Pending'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
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

        {/* Department Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Jurusan
          </label>
          <select
            value={filters.department || 'all'}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">Semua Jurusan</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.abbreviation} - {department.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status Akun
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* Onboarding Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status Onboarding
          </label>
          <select
            value={filters.onboarding || 'all'}
            onChange={(e) => handleFilterChange('onboarding', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersDisplay}
    </div>
  );
};

export default TeacherFilter;