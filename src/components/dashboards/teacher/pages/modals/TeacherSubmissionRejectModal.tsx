import React, { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionSubmission } from '@/services/questionSubmission';
import toast from 'react-hot-toast';

interface TeacherSubmissionRejectModalProps {
  submission: QuestionSubmission;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherSubmissionRejectModal: React.FC<TeacherSubmissionRejectModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Komentar penolakan wajib diisi');
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      // TODO: Implement reject API call
      // await questionSubmissionService.rejectSubmission(token, submission._id, comment);
      
      // Temporary success simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Soal berhasil ditolak');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menolak soal';
      toast.error(errorMessage);
      console.error('Error rejecting submission:', error);
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
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tolak Soal</h2>
              <p className="text-sm text-gray-500">Berikan alasan penolakan soal yang disubmit</p>
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
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              rows={4}
              placeholder="Jelaskan alasan mengapa soal ini ditolak..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Komentar ini akan dikirim kepada guru yang mengsubmit soal
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Konfirmasi Penolakan</h4>
                <p className="text-sm text-red-700">
                  Dengan menolak soal ini, soal akan dikembalikan kepada guru pembuat dengan komentar Anda. 
                  Guru dapat memperbaiki dan mengsubmit ulang soal tersebut.
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
            onClick={handleReject}
            disabled={loading || !comment.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Tolak Soal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSubmissionRejectModal;