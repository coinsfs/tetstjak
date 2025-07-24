import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ExpertiseProgram } from '@/types/expertise';
import { expertiseProgramService } from '@/services/expertise';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Hapus Jurusan</h2>
              <p className="text-sm text-gray-500">Konfirmasi penghapusan</p>
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
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-4">
              Apakah Anda yakin ingin menghapus jurusan berikut?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">
                    {expertiseProgram.abbreviation}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{expertiseProgram.name}</h3>
                  <p className="text-sm text-gray-500">{expertiseProgram.description}</p>
                  {expertiseProgram.head_of_department_details && (
                    <p className="text-xs text-gray-400 mt-1">
                      Kepala Jurusan: {expertiseProgram.head_of_department_details.full_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Peringatan!</h4>
                <p className="text-sm text-red-700">
                  Tindakan ini tidak dapat dibatalkan. Semua data yang terkait dengan jurusan ini 
                  mungkin akan terpengaruh.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Jurusan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertiseProgramDeleteModal;