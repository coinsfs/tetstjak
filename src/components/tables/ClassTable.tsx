import React, { memo } from 'react';
import { Eye, Edit, Trash2, School, User, Users, Calendar } from 'lucide-react';
import { Class } from '@/types/class';
import { getProfileImageUrl } from '@/constants/config';

interface ClassTableProps {
  classes: Class[];
  loading: boolean;
  onViewClass: (classData: Class) => void;
  onEditClass: (classData: Class) => void;
  onDeleteClass: (classData: Class) => void;
}

const ClassTable: React.FC<ClassTableProps> = memo(({
  classes,
  loading,
  onViewClass,
  onEditClass,
  onDeleteClass
}) => {
  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data kelas</h3>
          <p className="text-gray-500">
            {loading ? 'Memuat data kelas...' : 'Belum ada kelas yang terdaftar atau sesuai dengan filter yang dipilih.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                Kelas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">
                Jurusan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                Tahun Ajaran
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                Wali Kelas
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((classData) => (
              <tr key={classData._id} className="hover:bg-gray-50 transition-colors">
                {/* Class Info */}
                <td className="px-6 py-4 w-[300px]">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <School className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1 break-words leading-tight">
                        {getGradeLabel(classData.grade_level)} {classData.expertise_details?.abbreviation} {classData.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Tingkat: Kelas {getGradeLabel(classData.grade_level)}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Expertise */}
                <td className="px-6 py-4 w-[250px]">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 break-words leading-tight">
                      {classData.expertise_details?.name || 'Tidak ada data'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {classData.expertise_details?.abbreviation}
                    </div>
                  </div>
                </td>

                {/* Academic Year */}
                <td className="px-6 py-4 w-[150px]">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {classData.academic_year}
                  </div>
                </td>

                {/* Homeroom Teacher */}
                <td className="px-6 py-4 w-[300px]">
                  <div className="flex items-center">
                    {classData.homeroom_teacher_details?.profile_picture_url ? (
                      <img
                        src={getProfileImageUrl(classData.homeroom_teacher_details.profile_picture_url) || ''}
                        alt={classData.homeroom_teacher_details.full_name}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 ${
                      classData.homeroom_teacher_details?.profile_picture_url ? 'hidden' : ''
                    }`}>
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {classData.homeroom_teacher_details ? (
                        <>
                          <div className="text-sm font-medium text-gray-900 break-words leading-tight">
                            {classData.homeroom_teacher_details.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Wali Kelas
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Belum ada wali kelas
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 w-[150px]">
                  <div className="flex items-center justify-center space-x-1">
                    {/* View Detail Button */}
                    <button
                      onClick={() => onViewClass(classData)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail & Siswa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditClass(classData)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Kelas"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteClass(classData)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ClassTable.displayName = 'ClassTable';

export default ClassTable;