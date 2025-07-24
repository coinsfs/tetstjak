import React from 'react';
import { X, User, Phone, MapPin, Building, GraduationCap, BookOpen, CheckCircle, Clock, UserX, Check } from 'lucide-react';
import { Teacher } from '@/types/user';

interface TeacherDetailModalProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: () => void;
}

const getOnboardingBadge = (teacher: Teacher) => {
    if (teacher.onboarding_completed) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Selesai
            </span>
        );
    }
    
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
        </span>
    );
};

const getStatusBadge = (teacher: Teacher) => {
    if (!teacher.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <UserX className="w-3 h-3 mr-1" />
          Nonaktif
        </span>
      );
    }
  
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        Aktif
      </span>
    );
  };
  

const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  teacher,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detail Guru</h3>
                <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                >
                <X className="w-5 h-5" />
                </button>
            </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
            {/* Basic Info */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Dasar</h4>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500">NKTAM</label>
                    <p className="text-sm font-medium text-gray-900">{teacher.}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="text-sm font-medium text-gray-900">{teacher.email}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(teacher)}</div>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Onboarding</label>
                    <div className="mt-1">{getOnboardingBadge(teacher)}</div>
                </div>
                </div>
            </div>

            {/* Profile Info */}
            {teacher.profile_details && (
                <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Pribadi</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500">Nama Lengkap</label>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {teacher.profile_details.full_name}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Jenis Kelamin</label>
                        <p className="text-sm font-medium text-gray-900">
                        {teacher.profile_details.gender}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Tanggal Lahir</label>
                        <p className="text-sm font-medium text-gray-900">
                        {formatDate(teacher.profile_details.birth_date)}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Tempat Lahir</label>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {teacher.profile_details.birth_place}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">No. Telepon</label>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {teacher.profile_details.phone_number}
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Alamat</label>
                        <p className="text-sm font-medium text-gray-900 flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                        {teacher.profile_details.address}
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            )}

            {/* Department Info */}
            {teacher.department_details && (
                <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Jurusan</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-xs text-gray-500">Nama Jurusan</label>
                        <p className="text-sm font-medium text-gray-900">
                        {teacher.department_details.name}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Singkatan</label>
                        <p className="text-sm font-medium text-gray-900">
                        {teacher.department_details.abbreviation}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Deskripsi</label>
                        <p className="text-sm text-gray-700">
                        {teacher.department_details.description}
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            )}

            {/* Teaching Summary */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Mata Pelajaran yang Diajar
                </h4>
                {teacher.teaching_summary && teacher.teaching_summary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teacher.teaching_summary.map((teaching, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h5 className="text-sm font-semibold text-blue-900 mb-1">
                            {teaching.subject_name}
                            </h5>
                            <p className="text-xs text-blue-700 flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            Kelas: {teaching.class_name}
                            </p>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Belum ada mata pelajaran</p>
                    <p className="text-xs text-gray-400">Guru belum ditugaskan mengajar mata pelajaran apapun</p>
                </div>
                )}
            </div>

            {/* Timestamps */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Waktu</h4>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500">Bergabung</label>
                    <p className="text-sm font-medium text-gray-900">
                    {formatDate(teacher.created_at)}
                    </p>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Terakhir Diupdate</label>
                    <p className="text-sm font-medium text-gray-900">
                    {formatDate(teacher.updated_at)}
                    </p>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Password Terakhir Diubah</label>
                    <p className="text-sm font-medium text-gray-900">
                    {teacher.password_last_changed_at 
                        ? formatDate(teacher.password_last_changed_at)
                        : 'Belum pernah diubah'
                    }
                    </p>
                </div>
                </div>
            </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                Tutup
            </button>
            </div>
        </div>
    </div>
  );
};

export default TeacherDetailModal;