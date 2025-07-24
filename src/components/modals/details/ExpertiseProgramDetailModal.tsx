import React from 'react';
import { X, GraduationCap, User, Calendar, FileText, Hash, Building } from 'lucide-react';
import { ExpertiseProgram } from '@/types/expertise';
import { getProfileImageUrl } from '@/constants/config';

interface ExpertiseProgramDetailModalProps {
  expertiseProgram: ExpertiseProgram;
  isOpen: boolean;
  onClose: () => void;
}

const ExpertiseProgramDetailModal: React.FC<ExpertiseProgramDetailModalProps> = ({
  expertiseProgram,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHeadOfDepartmentName = () => {
    return expertiseProgram.head_of_department_details?.profile_details?.full_name || 'Tidak ada';
  };

  const getHeadOfDepartmentImage = () => {
    const profilePictureUrl = expertiseProgram.head_of_department_details?.profile_details?.profile_picture_url;
    return profilePictureUrl ? getProfileImageUrl(profilePictureUrl) : null;
  };

  const getHeadOfDepartmentInfo = () => {
    const details = expertiseProgram.head_of_department_details;
    if (!details) return null;

    return {
      loginId: details.login_id,
      email: details.email,
      phone: details.profile_details?.phone_number,
      gender: details.profile_details?.gender,
      address: details.profile_details?.address
    };
  };

  const headInfo = getHeadOfDepartmentInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Jurusan</h2>
              <p className="text-sm text-gray-500">Informasi lengkap program keahlian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-600" />
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Jurusan
                </label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                  {expertiseProgram.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Singkatan
                </label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                    {expertiseProgram.abbreviation}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <p className="text-sm text-gray-900 bg-white p-3 rounded border min-h-[60px]">
                {expertiseProgram.description}
              </p>
            </div>
          </div>

          {/* Head of Department Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Kepala Jurusan
            </h3>
            
            {expertiseProgram.head_of_department_details ? (
              <div className="space-y-4">
                {/* Profile Section */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {getHeadOfDepartmentImage() ? (
                      <img
                        src={getHeadOfDepartmentImage()!}
                        alt={getHeadOfDepartmentName()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {getHeadOfDepartmentName()}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {headInfo?.loginId} • {headInfo?.email}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                {headInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {headInfo.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor Telepon
                        </label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {headInfo.phone}
                        </p>
                      </div>
                    )}
                    {headInfo.gender && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jenis Kelamin
                        </label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {headInfo.gender}
                        </p>
                      </div>
                    )}
                    {headInfo.address && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alamat
                        </label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {headInfo.address}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada kepala jurusan yang ditugaskan</p>
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Informasi Sistem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  ID Jurusan
                </label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border font-mono">
                  {expertiseProgram._id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Tanggal Dibuat
                </label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                  {formatDate(expertiseProgram.created_at)}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Terakhir Diperbarui
                </label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                  {formatDate(expertiseProgram.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpertiseProgramDetailModal;