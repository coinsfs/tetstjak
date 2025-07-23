import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { StudentFilters } from '@/types/user';
import { userService } from '@/services/user';
import { useAuth } from '@/contexts/AuthContext';

interface StudentFilterProps {
  filters: StudentFilters;
  onFiltersChange: (filters: StudentFilters) => void;
  onResetFilters: () => void;
}

interface ExpertiseProgram {
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

const StudentFilter: React.FC<StudentFilterProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const { token } = useAuth();
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [expertiseProgramsLoading, setExpertiseProgramsLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setExpertiseProgramsLoading(true);
        setClassesLoading(true);
        const [expertiseData, classData] = await Promise.all([
          userService.getExpertisePrograms(token),
          userService.getClasses(token)
        ]);

        setExpertisePrograms(expertiseData);
        setClasses(Array.isArray(classData) ? classData : []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
        setExpertisePrograms([]);
        setClasses([]);
      } finally {
        setExpertiseProgramsLoading(false);
        setClassesLoading(false);
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
  }, [searchValue]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: keyof StudentFilters, value: string) => {
    const newFilters = { ...filters };
    
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    // Reset class filter when grade level or expertise changes
    if (key === 'grade_level' || key === 'expertise_id') {
      delete newFilters.class_id;
    }

    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Filter classes based on selected grade level and expertise
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    if (filters.grade_level && filters.grade_level !== 'all') {
      filtered = filtered.filter(cls => cls.grade_level.toString() === filters.grade_level);
    }

    if (filters.expertise_id && filters.expertise_id !== 'all') {
      filtered = filtered.filter(cls => cls.expertise_id === filters.expertise_id);
    }

    return filtered;
  }, [classes, filters.grade_level, filters.expertise_id]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Siswa</h3>
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
        <div className="space-y-2 flex-1 min-w-[200px] max-w-[40%]">
          <label className="block text-sm font-medium text-gray-700">
            Pencarian
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Grade Level Filter - Always available */}
        <div className="space-y-2 flex-1 min-w-[150px] max-w-[20%]">
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

        {/* Expertise Filter - Show immediately with loading state */}
        <div className="space-y-2 flex-1 min-w-[150px] max-w-[20%]">
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
            {!expertiseProgramsLoading && expertisePrograms.map((expertise) => (
              <option key={expertise._id} value={expertise._id}>
                {expertise.abbreviation} - {expertise.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter - Show immediately with loading state */}
        <div className="space-y-2 flex-1 min-w-[150px] max-w-[20%]">
          <label className="block text-sm font-medium text-gray-700">
            Kelas
          </label>
          <select
            value={filters.class_id || 'all'}
            onChange={(e) => handleFilterChange('class_id', e.target.value)}
            disabled={classesLoading || filteredClasses.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="all">
              {classesLoading ? 'Memuat kelas...' : 
               filteredClasses.length === 0 ? 'Tidak ada kelas' : 'Semua Kelas'}
            </option>
            {!classesLoading && filteredClasses.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.grade_level} {cls.expertise_details.abbreviation} {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.grade_level || filters.expertise_id || filters.class_id) && (
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
                  Jurusan: {expertiseProgramsLoading ? 'Memuat...' : expertisePrograms.find(e => e._id === filters.expertise_id)?.abbreviation}
                </span>
              )}
              {filters.class_id && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">
                  Kelas: {classesLoading ? 'Memuat...' : filteredClasses.find(c => c._id === filters.class_id)?.name}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFilter;