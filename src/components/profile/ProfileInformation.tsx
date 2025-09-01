import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfilePictureUpload from './ProfilePictureUpload';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Building, 
  GraduationCap,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ProfileInformation: React.FC = () => {
  const { user } = useAuth();
  const [showAllTeaching, setShowAllTeaching] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat informasi profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Guru';
      case 'student': return 'Siswa';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <ProfilePictureUpload 
                size="lg" 
                showUploadText={false}
              />
              {/* Status Badge */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                user.is_active ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {user.is_active ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : (
                  <XCircle className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="text-center sm:text-left text-white">
              <h2 className="text-2xl font-bold mb-2">
                {user.profile_details?.full_name || user.login_id}
              </h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                {user.roles.map((role, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(role)} bg-opacity-90`}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleLabel(role)}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-4 text-sm text-blue-100">
                <div className="flex items-center space-x-1 min-w-0">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-1 min-w-0">
                  <User className="w-4 h-4" />
                  <span className="truncate">{user.login_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Informasi Pribadi</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <User className="w-4 h-4 text-gray-400 mt-1" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                <p className="text-gray-900 break-words">{user.profile_details?.full_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 text-gray-400 mt-1 flex items-center justify-center">
                <span className="text-xs font-bold">JK</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Jenis Kelamin</p>
                <p className="text-gray-900">
                  {user.profile_details?.gender === 'male' ? 'Laki-laki' : 
                   user.profile_details?.gender === 'female' ? 'Perempuan' : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Tanggal Lahir</p>
                <p className="text-gray-900">
                  {user.profile_details?.birth_date ? formatDate(user.profile_details.birth_date) : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Tempat Lahir</p>
                <p className="text-gray-900">{user.profile_details?.birth_place || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Alamat</p>
                <p className="text-gray-900 break-words">{user.profile_details?.address || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-gray-400 mt-1" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Nomor Telepon</p>
                <p className="text-gray-900 break-words">{user.profile_details?.phone_number || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic/Work Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Building className="w-5 h-5 text-green-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Informasi Akademik</h3>
          </div>

          <div className="space-y-4">
            {/* Department/Class Info */}
            {user.department_details && (
              <>
                <div className="flex items-start space-x-3">
                  <Building className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Jurusan</p>
                    <p className="text-gray-900">{user.department_details.name}</p>
                    <p className="text-xs text-gray-500">({user.department_details.abbreviation})</p>
                  </div>
                </div>
              </>
            )}

            {user.class_details && (
              <>
                <div className="flex items-start space-x-3">
                  <GraduationCap className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kelas</p>
                    <p className="text-gray-900">
                      {user.class_details.grade_level} - {user.class_details.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tahun Ajaran</p>
                    <p className="text-gray-900">{user.class_details.academic_year}</p>
                  </div>
                </div>
              </>
            )}

            {user.profile_details?.start_year && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Tahun Masuk</p>
                  <p className="text-gray-900">{user.profile_details.start_year}</p>
                </div>
              </div>
            )}

            {user.profile_details?.end_year && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Tahun Keluar</p>
                  <p className="text-gray-900">{user.profile_details.end_year}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Informasi Akun</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className={`w-4 h-4 mt-1 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status Akun</p>
                <p className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Onboarding</p>
                <p className={`font-medium ${user.onboarding_completed ? 'text-green-600' : 'text-orange-600'}`}>
                  {user.onboarding_completed ? 'Selesai' : 'Belum Selesai'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Dibuat</p>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Terakhir Diperbarui</p>
                <p className="text-gray-900">{formatDate(user.updated_at)}</p>
              </div>
            </div>

            {user.password_last_changed_at && (
              <div className="flex items-start space-x-3">
                <Shield className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Password Terakhir Diubah</p>
                  <p className="text-gray-900">{formatDate(user.password_last_changed_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Teaching Summary (for teachers) */}
        {user.roles.includes('teacher') && user.teaching_summary && user.teaching_summary.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-orange-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ringkasan Mengajar</h3>
              </div>
              <div className="text-sm text-gray-500">
                {user.teaching_summary.length} kelas
              </div>
            </div>

            {/* Teaching items container with max height and scroll */}
            <div className={`relative transition-all duration-300 ${
              showAllTeaching ? 'max-h-none' : 'max-h-60 overflow-hidden'
            }`}>
              <div className="space-y-3">
                {user.teaching_summary.map((teaching: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 break-words">{teaching.subject_name}</p>
                      <p className="text-sm text-gray-500 break-words">{teaching.class_name}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Scroll indicator for collapsed state */}
              {!showAllTeaching && user.teaching_summary.length > 4 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-lg"></div>
              )}
            </div>

            {/* Show/Hide toggle button if more than 4 items */}
            {user.teaching_summary.length > 4 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAllTeaching(!showAllTeaching)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span>
                    {showAllTeaching 
                      ? `Sembunyikan ${user.teaching_summary.length - 4} kelas lainnya` 
                      : `Lihat ${user.teaching_summary.length - 4} kelas lainnya`
                    }
                  </span>
                  {showAllTeaching ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileInformation;