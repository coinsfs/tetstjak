import React from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, GraduationCap, School, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Student } from '@/types/user';

interface StudentDetailModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Siswa</h2>
              <p className="text-sm text-gray-500">Informasi lengkap siswa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informasi Dasar
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nama Lengkap</p>
                    <p className="font-medium text-gray-900">
                      {student.profile_details?.full_name || 'Tidak tersedia'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nomor Telepon</p>
                    <p className="font-medium text-gray-900">
                      {student.profile_details?.phone_number || 'Tidak tersedia'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tempat, Tanggal Lahir</p>
                    <p className="font-medium text-gray-900">
                      {student.profile_details?.birth_place || 'Tidak tersedia'}
                      {student.profile_details?.birth_date && 
                        `, ${formatDate(student.profile_details.birth_date)}`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Alamat</p>
                    <p className="font-medium text-gray-900">
                      {student.profile_details?.address || 'Tidak tersedia'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informasi Akademik
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">NIS</p>
                    <p className="font-medium text-gray-900">{student.login_id}</p>
                  </div>
                </div>

                {student.class_details ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <School className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Kelas</p>
                        <p className="font-medium text-gray-900">
                          {getGradeLabel(student.class_details.grade_level)} {student.class_details.expertise_details?.abbreviation} {student.class_details.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Jurusan</p>
                        <p className="font-medium text-gray-900">
                          {student.class_details.expertise_details?.name || 'Tidak tersedia'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.class_details.expertise_details?.abbreviation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Tahun Ajaran</p>
                        <p className="font-medium text-gray-900">{student.class_details.academic_year}</p>
                      </div>
                    </div>

                    {student.class_details.homeroom_teacher_details && (
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Wali Kelas</p>
                          <p className="font-medium text-gray-900">
                            {student.class_details.homeroom_teacher_details.full_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <School className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum terdaftar di kelas manapun</p>
                  </div>
                )}

                {student.profile_details?.start_year && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Periode Studi</p>
                      <p className="font-medium text-gray-900">
                        {student.profile_details.start_year} - {student.profile_details.end_year || 'Sekarang'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {student.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm text-gray-500">Status Akun</p>
                  <p className={`font-medium ${student.is_active ? 'text-green-700' : 'text-red-700'}`}>
                    {student.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {student.onboarding_completed ? (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm text-gray-500">Onboarding</p>
                  <p className={`font-medium ${student.onboarding_completed ? 'text-blue-700' : 'text-yellow-700'}`}>
                    {student.onboarding_completed ? 'Selesai' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Terdaftar</p>
                  <p className="font-medium text-gray-700">
                    {formatDate(student.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;