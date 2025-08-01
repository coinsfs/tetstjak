import React, { useState } from 'react';
import { X, Check, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionSubmission } from '@/services/questionSubmission';
import toast from 'react-hot-toast';

interface TeacherSubmissionApproveModalProps {
  submission: QuestionSubmission;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherSubmissionApproveModal: React.FC<TeacherSubmissionApproveModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const handleApprove = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // TODO: Implement approve API call
      // await questionSubmissionService.approveSubmission(token, submission._id, comment);
      
      // Temporary success simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Soal berhasil disetujui');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyetujui soal';
      toast.error(errorMessage);
      console.error('Error approving submission:', error);
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Setujui Soal</h2>
              <p className="text-sm text-gray-500">Konfirmasi persetujuan soal yang disubmit</p>
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
        <div className="p-6 space-y-6">
          {/* Question Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Preview Soal</h3>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getTypeLabel(submission.question_details.question_type)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {getDifficultyLabel(submission.question_details.difficulty)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {submission.question_details.points} poin
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: submission.question_details.question_text }} />
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">Tujuan:</span> {submission.purpose}
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komentar Persetujuan (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              rows={3}
              placeholder="Tambahkan komentar untuk persetujuan ini..."
            />
          </div>

          {/* Confirmation Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">Konfirmasi Persetujuan</h4>
                <p className="text-sm text-green-700">
                  Dengan menyetujui soal ini, soal akan masuk ke dalam bank soal publik dan dapat digunakan oleh guru lain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Setujui Soal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSubmissionApproveModal;