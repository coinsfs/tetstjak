import React, { memo } from 'react';
import { Eye, Edit, UserX, UserCheck, Trash2, User, MapPin, Phone, Mail } from 'lucide-react';
import { Student } from '@/types/user';

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onToggleStatus: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
}

const StudentTable: React.FC<StudentTableProps> = memo(({
  students,
  loading,
  onViewStudent,
  onEditStudent,
  onToggleStatus,
  onDeleteStudent
}) => {

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data siswa</h3>
          <p className="text-gray-500">
            {loading ? 'Memuat data siswa...' : 'Belum ada siswa yang terdaftar atau sesuai dengan filter yang dipilih.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="intelligent-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="col-wide text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Siswa
              </th>
              <th className="col-medium text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kelas & Jurusan
              </th>
              <th className="col-medium text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="col-actions text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                {/* Student Info */}
                <td className="col-wide" title={student.profile_details?.full_name || 'Nama tidak tersedia'}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {student.profile_details?.full_name || 'Nama tidak tersedia'}
                      </div>
                      <div className="text-sm text-gray-500">
                        NIS: {student.login_id}
                      </div>
                      {student.profile_details?.birth_place && (
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{student.profile_details.birth_place}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Class & Department */}
                <td className="col-medium" title={student.class_details ? `${getGradeLabel(student.class_details.grade_level)} ${student.class_details.expertise_details?.abbreviation} ${student.class_details.name}` : 'Kelas belum ditentukan'}>
                  <div className="space-y-1">
                    {student.class_details ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {getGradeLabel(student.class_details.grade_level)}{" "}
                          {student.class_details.expertise_details?.abbreviation}{" "}
                          {student.class_details.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.class_details.expertise_details?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          TA: {student.class_details.academic_year}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">
                        Kelas belum ditentukan
                      </div>
                    )}
                  </div>
                </td>

                {/* Contact */}
                <td className="col-medium" title={`${student.email}${student.profile_details?.phone_number ? ` | ${student.profile_details.phone_number}` : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-3 h-3 mr-2 text-gray-400" />
                      <span>{student.email}</span>
                    </div>
                    {student.profile_details?.phone_number && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="w-3 h-3 mr-2 text-gray-400" />
                        <span>{student.profile_details.phone_number}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="col-medium">
                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.onboarding_completed 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.onboarding_completed ? 'Onboarding Selesai' : 'Onboarding Pending'}
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="col-actions">
                  <div className="flex items-center justify-center space-x-2">
                    {/* View Button */}
                    <button
                      onClick={() => onViewStudent(student)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditStudent(student)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Siswa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Toggle Status Button */}
                    <button
                      onClick={() => onToggleStatus(student)}
                      className={`p-2 rounded-md transition-colors ${
                        student.is_active
                          ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      title={student.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {student.is_active ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteStudent(student)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus Siswa"
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

StudentTable.displayName = 'StudentTable';

export default StudentTable;