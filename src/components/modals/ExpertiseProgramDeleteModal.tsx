import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { ExpertiseProgram } from '@/types/expertise';
import { expertiseProgramService } from '@/services/expertise';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExpertiseProgramDeleteModalProps {
  expertiseProgram: ExpertiseProgram;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ExpertiseProgramDeleteModal: React.FC<ExpertiseProgramDeleteModalProps> = ({
  expertiseProgram,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!token) return;

    try {
      setLoading(true);
      await expertiseProgramService.deleteExpertiseProgram(token, expertiseProgram._id);
      toast.success('Jurusan berhasil dihapus');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus jurusan';
      toast.error(errorMessage);
      console.error('Error deleting expertise program:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getHeadOfDepartmentName = () => {
    return expertiseProgram.head_of_department_details?.profile_details?.full_name || 'Tidak ada';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Hapus Jurusan</h2>
              <p className="text-sm text-gray-500">Konfirmasi penghapusan data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus jurusan berikut?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Nama Jurusan:</span>
                <span className="text-sm text-gray-900">{expertiseProgram.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Singkatan:</span>
                <span className="text-sm text-gray-900">{expertiseProgram.abbreviation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Kepala Jurusan:</span>
                <span className="text-sm text-gray-900">{getHeadOfDepartmentName()}</span>
              </div>
            </div>
          </div>

          {/* Warning about dependencies */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-800 mb-1">Perhatian!</h4>
                <p className="text-sm text-orange-700 mb-2">
                  Jurusan ini mungkin memiliki data terkait yang akan terpengaruh:
                </p>
                <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                  <li>Kelas-kelas yang menggunakan jurusan ini</li>
                  <li>Siswa dan guru yang terdaftar di jurusan ini</li>
                  <li>Penugasan mengajar dan kurikulum</li>
                  <li>Data akademik dan ujian</li>
                </ul>
                <p className="text-sm text-orange-700 mt-2 font-medium">
                  Sebaiknya pindahkan semua kelas dan pengguna ke jurusan lain terlebih dahulu.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Dampak Penghapusan</h4>
                <p className="text-sm text-red-700">
                  • Semua kelas di jurusan ini akan kehilangan referensi<br/>
                  • Siswa dan guru akan kehilangan afiliasi jurusan<br/>
                  • Penugasan mengajar akan terpengaruh<br/>
                  • Riwayat akademik jurusan akan hilang<br/>
                  • <strong>Tindakan ini tidak dapat dibatalkan</strong>
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
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpertiseProgramDeleteModal;