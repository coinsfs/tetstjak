import React, { memo } from 'react';
import { Eye, Edit, Trash2, User, GraduationCap, FileText } from 'lucide-react';
import { ExpertiseProgram } from '@/types/expertise';
import { getProfileImageUrl } from '@/constants/config';

interface ExpertiseProgramTableProps {
  expertisePrograms: ExpertiseProgram[];
  loading?: boolean;
  onViewExpertiseProgram: (expertiseProgram: ExpertiseProgram) => void;
  onEditExpertiseProgram: (expertiseProgram: ExpertiseProgram) => void;
  onDeleteExpertiseProgram: (expertiseProgram: ExpertiseProgram) => void;
}

const ExpertiseProgramTable: React.FC<ExpertiseProgramTableProps> = memo(({
  expertisePrograms,
  loading = false,
  onViewExpertiseProgram,
  onEditExpertiseProgram,
  onDeleteExpertiseProgram
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getHeadOfDepartmentName = (expertiseProgram: ExpertiseProgram) => {
    return expertiseProgram.head_of_department_details?.profile_details?.full_name || 'Tidak ada';
  };

  const getHeadOfDepartmentImage = (expertiseProgram: ExpertiseProgram) => {
    const profilePictureUrl = expertiseProgram.head_of_department_details?.profile_details?.profile_picture_key;
    return profilePictureUrl ? getProfileImageUrl(profilePictureUrl) : null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (expertisePrograms.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data jurusan</h3>
          <p className="text-gray-500">Data jurusan akan muncul di sini setelah ditambahkan.</p>
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
              <th className="col-medium text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Jurusan
              </th>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Singkatan
              </th>
              <th className="col-wide text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="col-medium text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kepala Jurusan
              </th>
              <th className="col-narrow text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dibuat
              </th>
              <th className="col-actions text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expertisePrograms.map((expertiseProgram) => (
              <tr key={expertiseProgram._id} className="hover:bg-gray-50 transition-colors">
                {/* Nama Jurusan */}
                <td className="col-medium col-expertise-name" title={expertiseProgram.name}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {expertiseProgram.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Singkatan */}
                <td className="col-narrow">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                    {expertiseProgram.abbreviation}
                  </span>
                </td>

                {/* Deskripsi */}
                <td className="col-wide col-expertise-description" title={expertiseProgram.description}>
                  <div className="text-sm text-gray-900">
                    {expertiseProgram.description}
                  </div>
                </td>

                {/* Kepala Jurusan */}
                <td className="col-medium" title={getHeadOfDepartmentName(expertiseProgram)}>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 overflow-hidden">
                      {getHeadOfDepartmentImage(expertiseProgram) ? (
                        <img
                          src={getHeadOfDepartmentImage(expertiseProgram)!}
                          alt={getHeadOfDepartmentName(expertiseProgram)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-900">
                      {getHeadOfDepartmentName(expertiseProgram)}
                    </div>
                  </div>
                </td>

                {/* Tanggal Dibuat */}
                <td className="col-narrow">
                  <div className="text-sm text-gray-500">
                    {formatDate(expertiseProgram.created_at)}
                  </div>
                </td>

                {/* Aksi */}
                <td className="col-actions">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewExpertiseProgram(expertiseProgram)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditExpertiseProgram(expertiseProgram)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteExpertiseProgram(expertiseProgram)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus"
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

ExpertiseProgramTable.displayName = 'ExpertiseProgramTable';

export default ExpertiseProgramTable;