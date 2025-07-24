import React, { memo } from 'react';
import { User, BookOpen, School, ChevronDown } from 'lucide-react';
import { AssignmentMatrix as AssignmentMatrixType } from '@/types/assignment';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { Teacher } from '@/types/user';

interface AssignmentMatrixProps {
  matrix: AssignmentMatrixType;
  classes: Class[];
  subjects: Subject[];
  teachers: Teacher[];
  onCellChange: (classId: string, subjectId: string, teacherId: string | null) => void;
}

const AssignmentMatrix: React.FC<AssignmentMatrixProps> = memo(({
  matrix,
  classes,
  subjects,
  teachers,
  onCellChange
}) => {
  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  const formatClassName = (cls: Class) => {
    return `${getGradeLabel(cls.grade_level)} ${cls.expertise_details?.abbreviation || ''} ${cls.name}`.trim();
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.profile_details?.full_name || 'Unknown Teacher';
  };

  const handleCellChange = (classId: string, subjectId: string, value: string) => {
    const teacherId = value === '' ? null : value;
    onCellChange(classId, subjectId, teacherId);
  };

  if (classes.length === 0 || subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Tersedia</h3>
        <p className="text-gray-500">
          Pastikan data kelas dan mata pelajaran sudah tersedia untuk membuat matrix penugasan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Matrix Penugasan Guru</h3>
        <p className="text-sm text-gray-600 mt-1">
          Pilih guru untuk setiap kombinasi kelas dan mata pelajaran
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px] z-30">
                <div className="flex items-center space-x-2">
                  <School className="w-4 h-4" />
                  <span>Kelas</span>
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
            {classes.map((cls) => (
              <tr key={cls._id} className="hover:bg-gray-50">
                {/* Class Name - Sticky Column */}
                <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200 min-w-[200px] z-20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <School className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {formatClassName(cls)}
                      </div>
                      <div className="text-xs text-gray-500">
                        TA: {cls.academic_year}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Subject Assignments */}
                {subjects.map((subject) => {
                  const cell = matrix[cls._id]?.[subject._id];
                  const currentTeacherId = cell?.selectedTeacherId || '';
                  const isDirty = cell?.isDirty || false;

                  return (
                    <td
                      key={`${cls._id}-${subject._id}`}
                      className="px-4 py-3 text-center min-w-[200px] max-w-[250px] relative z-10"
                    >
                      <div className="relative">
                        <select
                          value={currentTeacherId}
                          onChange={(e) => handleCellChange(cls._id, subject._id, e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition-colors relative z-10 ${
                            isDirty
                              ? 'border-orange-300 bg-orange-50 text-orange-900'
                              : currentTeacherId
                              ? 'border-green-300 bg-green-50 text-green-900'
                              : 'border-gray-300 bg-gray-50 text-gray-500'
                          }`}
                        >
                          <option value="">-- Pilih Guru --</option>
                          {teachers.map((teacher) => (
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
                            {getTeacherName(currentTeacherId)}
                          </span>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-50 border border-gray-300 rounded"></div>
              <span className="text-gray-600">Belum ada penugasan</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-50 border border-green-300 rounded"></div>
              <span className="text-gray-600">Sudah ada penugasan</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-50 border border-orange-300 rounded relative">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <span className="text-gray-600">Ada perubahan</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Total: {classes.length} kelas × {subjects.length} mata pelajaran = {classes.length * subjects.length} penugasan
          </div>
        </div>
      </div>
    </div>
  );
});

AssignmentMatrix.displayName = 'AssignmentMatrix';

export default AssignmentMatrix;