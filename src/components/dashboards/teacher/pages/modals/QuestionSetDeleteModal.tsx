import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService, QuestionSet } from '@/services/questionSet';
import toast from 'react-hot-toast';

interface QuestionSetDeleteModalProps {
  questionSet: QuestionSet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuestionSetDeleteModal: React.FC<QuestionSetDeleteModalProps> = ({
  questionSet,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await questionSetService.deleteQuestionSet(token, questionSet._id);
      toast.success('Paket soal berhasil dihapus');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus paket soal';
      toast.error(errorMessage);
      console.error('Error deleting question set:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', label: 'Draft' };
      case 'published':
        return { color: 'bg-green-100 text-green-800', label: 'Published' };
      case 'archived':
        return { color: 'bg-red-100 text-red-800', label: 'Archived' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  if (!isOpen) return null;

  const statusInfo = getStatusBadge(questionSet.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h2>
              <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
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
        <div className="p-4 space-y-4">
          <div className="mb-4">
            <p className="text-gray-700 mb-4">
              Apakah Anda yakin ingin menghapus paket soal berikut?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Nama Paket Soal:</span>
                <p className="text-sm text-gray-900 mt-1 break-words">{questionSet.name}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Deskripsi:</span>
                <p className="text-sm text-gray-900 mt-1 break-words">{questionSet.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Mata Pelajaran:</span>
                  <p className="text-sm text-gray-900">
                    {questionSet.subject.name} ({questionSet.subject.code})
                  </p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Tingkat Kelas:</span>
                  <p className="text-sm text-gray-900">Kelas {getGradeLabel(questionSet.grade_level)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Soal:</span>
                  <p className="text-sm text-gray-900">{questionSet.metadata.total_questions} soal</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Visibilitas:</span>
                <p className="text-sm text-gray-900">
                  {questionSet.is_public ? 'Publik' : 'Pribadi'}
                </p>
              </div>
              
              {questionSet.metadata.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Tag:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {questionSet.metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Peringatan</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Paket soal yang sudah dihapus tidak dapat dikembalikan</li>
                  <li>• Semua soal dalam paket akan kehilangan referensi ke paket ini</li>
                  <li>• Jika paket ini digunakan dalam ujian, ujian tersebut akan terpengaruh</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Paket Soal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetDeleteModal;