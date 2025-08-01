import React from 'react';
import { Eye, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { QuestionSubmission } from '@/services/questionSubmission';

interface SubmittedQuestionsTableProps {
  submissions: QuestionSubmission[];
  onView: (submission: QuestionSubmission) => void;
  onApprove: (submission: QuestionSubmission) => void;
  onReject: (submission: QuestionSubmission) => void;
  showCheckbox?: boolean;
  selectedSubmissions?: string[];
  onSubmissionSelect?: (submissionId: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  showSelectAll?: boolean;
}

const SubmittedQuestionsTable: React.FC<SubmittedQuestionsTableProps> = ({
  submissions,
  onView,
  onApprove,
  onReject,
  showCheckbox = false,
  selectedSubmissions = [],
  onSubmissionSelect,
  onSelectAll,
  showSelectAll = false
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

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleSubmissionSelect = (submissionId: string) => {
    if (onSubmissionSelect) {
      onSubmissionSelect(submissionId);
    }
  };

  const isAllSelected = submissions.length > 0 && submissions.every(s => selectedSubmissions.includes(s._id));
  const isSomeSelected = selectedSubmissions.length > 0 && !isAllSelected;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 table-auto">
        <thead className="bg-gray-50">
          <tr>
            {showCheckbox && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Soal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipe
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kesulitan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Poin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tujuan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission) => {
            const statusInfo = getStatusBadge(submission.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <tr key={submission._id} className={`hover:bg-gray-50 transition-colors ${selectedSubmissions.includes(submission._id) ? 'bg-blue-50' : ''}`}>
                {showCheckbox && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.includes(submission._id)}
                      onChange={() => handleSubmissionSelect(submission._id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      <div dangerouslySetInnerHTML={{ __html: submission.question_details.question_text.substring(0, 100) + (submission.question_details.question_text.length > 100 ? '...' : '') }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {submission.question_details._id.slice(-8)}
                    </div>
                    {submission.question_details.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {submission.question_details.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {submission.question_details.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{submission.question_details.tags.length - 2} lagi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(submission.question_details.question_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(submission.question_details.difficulty)}`}>
                    {getDifficultyLabel(submission.question_details.difficulty)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {submission.question_details.points}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {submission.purpose}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    {submission.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => onApprove(submission)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          title="Setujui Soal"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(submission)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Tolak Soal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onView(submission)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubmittedQuestionsTable;