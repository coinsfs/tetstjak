import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService, Question } from '@/services/questionBank';
import toast from 'react-hot-toast';

interface TeacherQuestionDeleteModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherQuestionDeleteModal: React.FC<TeacherQuestionDeleteModalProps> = ({
  question,
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
      await questionBankService.deleteQuestion(token, question._id);
      toast.success('Soal berhasil dihapus');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus soal';
      toast.error(errorMessage);
      console.error('Error deleting question:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Pilihan Ganda';
      case 'essay': return 'Essay';
      default: return type;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Mudah';
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      default: return difficulty;
    }
  };

  if (!isOpen) return null;

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
              Apakah Anda yakin ingin menghapus soal berikut?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Teks Soal:</span>
                <p className="text-sm text-gray-900 mt-1 break-words">
                  {question.question_text}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Tipe Soal:</span>
                  <p className="text-sm text-gray-900">{getTypeLabel(question.question_type)}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Tingkat Kesulitan:</span>
                  <p className="text-sm text-gray-900">{getDifficultyLabel(question.difficulty)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Poin:</span>
                  <p className="text-sm text-gray-900">{question.points} poin</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <p className="text-sm text-gray-900 capitalize">
                    {question.status === 'private' ? 'Pribadi' : 
                     question.status === 'public' ? 'Publik' : question.status}
                  </p>
                </div>
              </div>
              
              {question.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Tag:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {question.tags.map((tag, index) => (
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
              
              {question.question_type === 'multiple_choice' && question.options.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Pilihan Jawaban:</span>
                  <div className="mt-1 space-y-1">
                    {question.options.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 w-4">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className={`text-sm ${option.is_correct ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                          {option.text}
                          {option.is_correct && <span className="ml-1 text-green-600">✓</span>}
                        </span>
                      </div>
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
                  <li>• Soal yang sudah dihapus tidak dapat dikembalikan</li>
                  <li>• Jika soal ini digunakan dalam ujian, ujian tersebut akan terpengaruh</li>
                  <li>• Data statistik soal akan hilang</li>
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
                <span>Hapus Soal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherQuestionDeleteModal;