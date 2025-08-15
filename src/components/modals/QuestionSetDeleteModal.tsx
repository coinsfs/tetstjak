import React, { useState } from 'react';
import { QuestionSet } from '@/types/questionSet';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService } from '@/services/questionSet';
import { X, Trash2, AlertTriangle } from 'lucide-react';
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
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!token || confirmText !== questionSet.name) return;

    setLoading(true);

    try {
      await questionSetService.deleteQuestionSet(token, questionSet._id);
      toast.success('Paket soal berhasil dihapus');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus paket soal';
      toast.error(errorMessage);
      console.error('Error deleting question set:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isConfirmValid = confirmText === questionSet.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hapus Paket Soal</h2>
              <p className="text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Peringatan!
                </h3>
                <p className="text-sm text-red-700">
                  Anda akan menghapus paket soal "<strong>{questionSet.name}</strong>". 
                  Tindakan ini akan menghapus semua data terkait dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Informasi Paket Soal:
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium text-gray-900">{questionSet.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mata Pelajaran:</span>
                  <span className="font-medium text-gray-900">{questionSet.subject.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Soal:</span>
                  <span className="font-medium text-gray-900">{questionSet.metadata.total_questions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900">{questionSet.status}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Untuk mengkonfirmasi, ketik nama paket soal: <strong>{questionSet.name}</strong>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Ketik nama paket soal"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || !isConfirmValid}
            className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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