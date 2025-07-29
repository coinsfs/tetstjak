import React, { memo } from 'react';
import { User, BookOpen, GraduationCap, ChevronDown } from 'lucide-react';
import { CoordinatorMatrix as CoordinatorMatrixType } from '@/types/subject';
import { Subject } from '@/types/subject';
import { Teacher } from '@/types/user';

interface CoordinatorMatrixProps {
  matrix: CoordinatorMatrixType;
  subjects: Subject[];
  availableTeachers: { [gradeLevel: string]: { [subjectId: string]: Teacher[] } };
  onCellChange: (gradeLevel: number, subjectId: string, teacherId: string | null) => void;
}

const GRADE_LEVELS = [
  { level: 10, label: 'X' },
  { level: 11, label: 'XI' },
  { level: 12, label: 'XII' }
];

const CoordinatorMatrix: React.FC<CoordinatorMatrixProps> = memo(({
  matrix,
  subjects,
  availableTeachers,
  onCellChange
}) => {
  const getTeacherName = (teacherId: string, gradeLevel: number, subjectId: string) => {
    const teachers = availableTeachers[gradeLevel.toString()]?.[subjectId] || [];
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.profile_details?.full_name || 'Unknown Teacher';
  };

  const handleCellChange = (gradeLevel: number, subjectId: string, value: string) => {
    const teacherId = value === '' ? null : value;
    onCellChange(gradeLevel, subjectId, teacherId);
  };

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Tersedia</h3>
        <p className="text-gray-500">
          Pastikan data mata pelajaran sudah tersedia untuk membuat matrix koordinator.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Matrix Koordinator Mata Pelajaran</h3>
        <p className="text-sm text-gray-600 mt-1">
          Pilih koordinator untuk setiap kombinasi jenjang kelas dan mata pelajaran
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[150px] z-30">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Jenjang Kelas</span>
                </div>
              </th>
              {subjects.map((subject) => (
                <th
                  key={subject._id}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] max-w-[250px] relative z-20"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-semibold">{subject.name}</span>
                    <span className="text-xs text-gray-400">({subject.code})</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {GRADE_LEVELS.map((grade) => (
              <tr key={grade.level} className="hover:bg-gray-50">
                {/* Grade Level - Sticky Column */}
                <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200 min-w-[150px] z-20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Kelas {grade.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        Grade {grade.level}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Subject Coordinators */}
                {subjects.map((subject) => {
                  const cell = matrix[grade.level.toString()]?.[subject._id];
                  const currentTeacherId = cell?.selectedTeacherId || '';
                  const isDirty = cell?.isDirty || false;
                  const availableTeachersForCell = availableTeachers[grade.level.toString()]?.[subject._id] || [];

                  return (
                    <td
                      key={`${grade.level}-${subject._id}`}
                      className="px-4 py-3 text-center min-w-[200px] max-w-[250px] relative z-10"
                    >
                      <div className="relative">
                        <select
                          value={currentTeacherId}
                          onChange={(e) => handleCellChange(grade.level, subject._id, e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer transition-colors relative z-10 ${
                            isDirty
                              ? 'border-orange-300 bg-orange-50 text-orange-900'
                              : currentTeacherId
                              ? 'border-green-300 bg-green-50 text-green-900'
                              : availableTeachersForCell.length > 0
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={availableTeachersForCell.length === 0}
                        >
                          <option value="">
                            {availableTeachersForCell.length > 0 ? '-- Pilih Koordinator --' : '-- Tidak Ada Guru --'}
                          </option>
                          {availableTeachersForCell.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {teacher.profile_details?.full_name || teacher.login_id}
                            </option>
                          ))}
                        </select>
                        
                        {/* Custom dropdown arrow */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>

                        {/* Status indicator */}
                        {isDirty && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Teacher info display */}
                      {currentTeacherId && (
                        <div className="mt-2 flex items-center justify-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600 truncate max-w-[180px]">
                            {getTeacherName(currentTeacherId, grade.level, subject._id)}
                          </span>
                        </div>
                      )}

                      {/* Available teachers count */}
                      {availableTeachersForCell.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          {availableTeachersForCell.length} guru tersedia
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
              <span className="text-gray-600">Belum ada koordinator</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-50 border border-green-300 rounded"></div>
              <span className="text-gray-600">Sudah ada koordinator</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-50 border border-orange-300 rounded relative">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <span className="text-gray-600">Ada perubahan</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">Tidak ada guru tersedia</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 sm:mt-0">
            Total: {GRADE_LEVELS.length} jenjang × {subjects.length} mata pelajaran = {GRADE_LEVELS.length * subjects.length} koordinator
          </div>
        </div>
      </div>
    </div>
  );
});

CoordinatorMatrix.displayName = 'CoordinatorMatrix';

export default CoordinatorMatrix;