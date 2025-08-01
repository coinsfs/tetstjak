import React from 'react';
import { Eye, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Check } from 'lucide-react';
import { QuestionSubmission } from '@/services/questionSubmission';

interface MySubmissionsExamViewProps {
  submissions: QuestionSubmission[];
  onView: (submission: QuestionSubmission) => void;
  onResubmit?: (submission: QuestionSubmission) => void;
}

const MySubmissionsExamView: React.FC<MySubmissionsExamViewProps> = ({
  submissions,
  onView,
  onResubmit
}) => {
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
        return { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Disubmit' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Disetujui' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Ditolak' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: status };
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {submissions.map((submission) => {
        const statusInfo = getStatusBadge(submission.status);
        const StatusIcon = statusInfo.icon;
        
        return (
          <div key={submission._id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(submission.question_details.question_type)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(submission.question_details.difficulty)}`}>
                    {getDifficultyLabel(submission.question_details.difficulty)}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {submission.question_details.points} poin
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none mb-3 text-sm sm:text-base">
                  <div dangerouslySetInnerHTML={{ __html: submission.question_details.question_text }} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Tujuan:</span> {submission.purpose}
                  </div>
                  <div>
                    <span className="font-medium">Tanggal Submit:</span> {formatDateTime(submission.created_at)}
                  </div>
                </div>
                
                {/* Options for Multiple Choice */}
                {submission.question_details.question_type === 'multiple_choice' && submission.question_details.options && submission.question_details.options.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pilihan Jawaban:</h4>
                    <div className="space-y-2">
                      {submission.question_details.options.map((option, optionIndex) => (
                        <div
                          key={option.id}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            option.is_correct 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                            option.is_correct 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm ${option.is_correct ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                                {option.text}
                              </p>
                              {option.is_correct && (
                                <div className="flex items-center space-x-1 ml-2">
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                            </div>
                            {option.is_correct && (
                              <p className="text-xs text-green-600 mt-1 flex items-center font-medium">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Jawaban Benar
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Reviewer Comment for Rejected */}
                {submission.status === 'rejected' && submission.reviewer_comment && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Alasan Penolakan:</h4>
                    <p className="text-sm text-red-700">{submission.reviewer_comment}</p>
                  </div>
                )}
                
                {submission.question_details.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {submission.question_details.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => onView(submission)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Detail</span>
                </button>
                {submission.status === 'rejected' && onResubmit && (
                  <button
                    onClick={() => onResubmit(submission)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Submit Ulang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MySubmissionsExamView;