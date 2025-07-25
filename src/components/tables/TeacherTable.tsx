import React, { memo } from 'react';
import { Eye, Edit, UserX, UserCheck, Trash2, User, Phone, Mail, Building2, CheckCircle, Clock } from 'lucide-react';
import { Teacher } from '@/types/user';

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

  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data guru</h3>
          <p className="text-gray-500">
            {loading ? 'Memuat data guru...' : 'Belum ada guru yang terdaftar atau sesuai dengan filter yang dipilih.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="intelligent-table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="col-wide text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Informasi Guru
              </th>
              <th className="col-medium text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kontak
              </th>
              <th className="col-medium text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Penugasan
              </th>
              <th className="col-narrow text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="col-actions text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                <td className="col-wide" title={teacher.profile_details?.full_name || 'N/A'}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
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
                
                <td className="col-medium" title={`${teacher.email}${teacher.profile_details?.phone_number ? ` | ${teacher.profile_details.phone_number}` : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{teacher.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{teacher.profile_details?.phone_number || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                
                <td className="col-medium" title={teacher.department_details?.name || 'Tidak ada penugasan'}>
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {teacher.department_details?.abbreviation || 'N/A'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {teacher.department_details?.name || 'Tidak ada penugasan'}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {teacher.teaching_summary && teacher.teaching_summary.length > 0 
                          ? `Mengajar ${teacher.teaching_summary.length} kelas`
                          : 'Belum ada kelas'
                        }
                      </div>
                    </div>
                  </div>
                </td>

                <td className="col-medium">
                  <div className="space-y-2">
                    <span className={`inline-flex items-center mr-2 px-3 py-1.5 text-xs font-semibold rounded-full ${
                      teacher.is_active
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
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
                    </span>
                    
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                      teacher.onboarding_completed
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
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
                  </div>
                </td>
                
                <td className="col-actions">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => onViewTeacher(teacher)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEditTeacher(teacher)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Guru"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleStatus(teacher)}
                      className={`p-2 rounded-md transition-colors ${
                        teacher.is_active
                          ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      title={teacher.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {teacher.is_active ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteTeacher(teacher)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus Guru"
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

TeacherTable.displayName = 'TeacherTable';

export default TeacherTable;