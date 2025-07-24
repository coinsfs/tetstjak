import React from 'react';
import { Eye, Edit, Trash2, User, GraduationCap } from 'lucide-react';
import { ExpertiseProgram } from '@/types/expertise';
import { getProfileImageUrl } from '@/constants/config';

interface ExpertiseProgramTableProps {
  expertisePrograms: ExpertiseProgram[];
  loading?: boolean;
  onViewExpertiseProgram: (expertiseProgram: ExpertiseProgram) => void;
  onEditExpertiseProgram: (expertiseProgram: ExpertiseProgram) => void;
  onDeleteExpertiseProgram: (expertiseProgram: ExpertiseProgram) => void;
}

const ExpertiseProgramTable: React.FC<ExpertiseProgramTableProps> = ({
  expertisePrograms,
  loading = false,
  onViewExpertiseProgram,
  onEditExpertiseProgram,
  onDeleteExpertiseProgram
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data jurusan...</p>
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
              <th className="col-actions text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expertisePrograms.map((expertiseProgram) => (
              <tr key={expertiseProgram._id} className="hover:bg-gray-50 transition-colors">
                {/* Nama Jurusan */}
                <td className="col-medium" title={expertiseProgram.name}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {expertiseProgram.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {expertiseProgram._id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Singkatan */}
                <td className="col-narrow">
                  <span className="inline-flex px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">
                    {expertiseProgram.abbreviation}
                  </span>
                </td>

                {/* Deskripsi */}
                <td className="col-wide" title={expertiseProgram.description}>
                  <div className="text-sm text-gray-900">
                    {expertiseProgram.description}
                  </div>
                </td>

                {/* Kepala Jurusan */}
                <td className="col-medium">
                  {expertiseProgram.head_of_department_details ? (
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                        {expertiseProgram.head_of_department_details.profile_picture_url ? (
                          <img
                            src={getProfileImageUrl(expertiseProgram.head_of_department_details.profile_picture_url) || ''}
                            alt={expertiseProgram.head_of_department_details.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {expertiseProgram.head_of_department_details.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {expertiseProgram.head_of_department_details.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-sm">Belum ditentukan</span>
                    </div>
                  )}
                </td>

                {/* Aksi */}
                <td className="col-actions">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onViewExpertiseProgram(expertiseProgram)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditExpertiseProgram(expertiseProgram)}
                      className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteExpertiseProgram(expertiseProgram)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
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
};

export default ExpertiseProgramTable;