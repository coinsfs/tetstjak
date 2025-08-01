import React from 'react';
import { Eye, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { QuestionSubmission } from '@/services/questionSubmission';

interface SubmittedQuestionsExamViewProps {
  submissions: QuestionSubmission[];
  onView: (submission: QuestionSubmission) => void;
  onApprove: (submission: QuestionSubmission) => void;
  onReject: (submission: QuestionSubmission) => void;
}

const SubmittedQuestionsExamView: React.FC<SubmittedQuestionsExamViewProps> = ({
  submissions,
  onView,
  onApprove,
  onReject
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
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status };
    }
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
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Tujuan:</span> {submission.purpose}
                </div>
                
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
                {submission.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => onApprove(submission)}
                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Setujui</span>
                    </button>
                    <button
                      onClick={() => onReject(submission)}
                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Tolak</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => onView(submission)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Detail</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubmittedQuestionsExamView;