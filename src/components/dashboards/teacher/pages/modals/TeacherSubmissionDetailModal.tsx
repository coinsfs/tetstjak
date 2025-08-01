import React from 'react';
import { X, HelpCircle, Calendar, User, BookOpen, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { QuestionSubmission } from '@/services/questionSubmission';

interface TeacherSubmissionDetailModalProps {
  submission: QuestionSubmission;
  isOpen: boolean;
  onClose: () => void;
}

const TeacherSubmissionDetailModal: React.FC<TeacherSubmissionDetailModalProps> = ({
  submission,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Disubmit' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Disetujui' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Ditolak' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: status };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusInfo = getStatusBadge(submission.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Soal Submission</h2>
              <p className="text-sm text-gray-500">Informasi lengkap soal yang disubmit</p>
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
          {/* Submission Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informasi Submission
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Tujuan</p>
                  <p className="font-medium text-gray-900">{submission.purpose}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Submit</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(submission.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Disubmit oleh</p>
                    <p className="font-medium text-gray-900">Guru lain</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Detail Soal
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Tipe Soal</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(submission.question_details.question_type)}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tingkat Kesulitan</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(submission.question_details.difficulty)}`}>
                    {getDifficultyLabel(submission.question_details.difficulty)}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Poin</p>
                    <p className="font-medium text-gray-900">{submission.question_details.points}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">ID Soal</p>
                  <p className="font-mono text-sm text-gray-900">{submission.question_details._id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konten Soal
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: submission.question_details.question_text }} />
              </div>
            </div>

            {/* Options for Multiple Choice */}
            {submission.question_details.question_type === 'multiple_choice' && submission.question_details.options && (
              <div className="space-y-2 mb-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Pilihan Jawaban</h4>
                {submission.question_details.options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded-md border ${
                      option.is_correct
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span>{option.text}</span>
                      {option.is_correct && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Jawaban Benar</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {submission.question_details.tags.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {submission.question_details.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviewer Comment */}
          {submission.reviewer_comment && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Komentar Reviewer
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">{submission.reviewer_comment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSubmissionDetailModal;