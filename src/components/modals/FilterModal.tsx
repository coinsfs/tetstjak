import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { ExpertiseProgram } from '@/types/expertise';
import { BasicTeacher } from '@/types/user';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string };
  selectedClass: string;
  selectedSubject: string;
  selectedGrade: string;
  selectedTeacher: string;
  selectedExpertise: string;
  activeTab: string;
  classes: Class[];
  subjects: Subject[];
  teachers: BasicTeacher[];
  expertisePrograms: ExpertiseProgram[];
  filterOptionsLoading: boolean;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => void;
  onClassChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onGradeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTeacherChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onExpertiseChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
  getActiveFilterCount: () => number;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  dateRange,
  selectedClass,
  selectedSubject,
  selectedGrade,
  selectedTeacher,
  selectedExpertise,
  activeTab,
  classes,
  subjects,
  teachers,
  expertisePrograms,
  filterOptionsLoading,
  onDateChange,
  onClassChange,
  onSubjectChange,
  onGradeChange,
  onTeacherChange,
  onExpertiseChange,
  onClearFilters,
  getActiveFilterCount
}) => {
  if (!isOpen) return null;

  const handleClearAndClose = () => {
    onClearFilters();
    onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Filter Data</h2>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-4">
          {/* Date Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Rentang Tanggal</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => onDateChange(e, 'start')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => onDateChange(e, 'end')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Academic Filters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Filter Akademik</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Jenjang</label>
                <select
                  value={selectedGrade}
                  onChange={onGradeChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Jenjang</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Kelas</label>
                <select
                  value={selectedClass}
                  onChange={onClassChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={filterOptionsLoading}
                >
                  <option value="">Semua Kelas</option>
                  {filterOptionsLoading ? (
                    <option disabled>Memuat...</option>
                  ) : (
                    classes.map((classItem) => (
                      <option key={classItem._id} value={classItem._id}>
                        Kelas {getGradeLabel(classItem.grade_level)} {classItem.expertise_details?.abbreviation} {classItem.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Mata Pelajaran</label>
                <select
                  value={selectedSubject}
                  onChange={onSubjectChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={filterOptionsLoading}
                >
                  <option value="">Semua Mata Pelajaran</option>
                  {filterOptionsLoading ? (
                    <option disabled>Memuat...</option>
                  ) : (
                    subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Teacher Filter - Only show when teacher tab is active */}
              {activeTab === 'teacher' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Guru</label>
                  <select
                    value={selectedTeacher}
                    onChange={onTeacherChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={filterOptionsLoading}
                  >
                    <option value="">Semua Guru</option>
                    {filterOptionsLoading ? (
                      <option disabled>Memuat...</option>
                    ) : (
                      teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.full_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
              
              {/* Expertise Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Program Keahlian</label>
                <select
                  value={selectedExpertise}
                  onChange={onExpertiseChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={filterOptionsLoading}
                >
                  <option value="">Semua Program Keahlian</option>
                  {filterOptionsLoading ? (
                    <option disabled>Memuat...</option>
                  ) : (
                    expertisePrograms.map((expertise) => (
                      <option key={expertise._id} value={expertise._id}>
                        {expertise.name} ({expertise.abbreviation})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleClearAndClose}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            disabled={filterOptionsLoading}
          >
            {filterOptionsLoading ? 'Memuat...' : 'Terapkan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;