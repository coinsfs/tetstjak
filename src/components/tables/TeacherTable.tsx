import React, { memo } from 'react';
import { Eye, Edit, UserX, UserCheck, Trash2, User, Phone, Mail, GraduationCap, Building2, CheckCircle, Clock } from 'lucide-react';
import { Teacher } from '../../types/teacher';

interface TeacherTableProps {
  teachers: Teacher[];
  loading: boolean;
  onViewTeacher: (teacher: Teacher) => void;
  onEditTeacher: (teacher: Teacher) => void;
  onToggleStatus: (teacher: Teacher) => void;
  onDeleteTeacher: (teacher: Teacher) => void;
}

const TeacherTable: React.FC<TeacherTableProps> = memo(({
  teachers,
  loading,
  onViewTeacher,
  onEditTeacher,
  onToggleStatus,
  onDeleteTeacher
}) => {

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-700">Memuat data guru...</span>
          </div>
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data guru</h3>
          <p className="text-gray-500">
            Belum ada guru yang terdaftar atau sesuai dengan filter yang dipilih.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Informasi Guru
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jurusan & Kelas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Onboarding
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-8 text-center">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data guru</h3>
                        <p className="text-gray-500">
                            Belum ada guru yang terdaftar atau sesuai dengan filter yang dipilih.
                        </p>
                    </div>
                </div>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {teacher.profile_details?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              NKTAM: {teacher.login_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          {teacher.profile_details?.phone_number || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                            {teacher.department_details?.abbreviation || 'N/A'}
                          </span>
                        </div>
                        {teacher.class_details && (
                          <div className="flex items-center">
                            <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-600">
                              Wali: {teacher.class_details.grade_level} {teacher.department_details?.abbreviation} {teacher.class_details.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleStatus(teacher)}
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                          teacher.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                        }`}
                      >
                        {teacher.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1.5" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1.5" />
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                        teacher.onboarding_completed
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {teacher.onboarding_completed ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                            Selesai
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1.5" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                            onViewTeacher(teacher);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            title="Lihat Detail"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditTeacher(teacher)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Guru"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTeacher(teacher)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
});

TeacherTable.displayName = 'TeacherTable';

export default TeacherTable;