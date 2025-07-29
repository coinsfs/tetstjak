import React from 'react';
import { Eye, Edit, Trash2, Tag, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Question } from '@/services/questionBank';

interface QuestionDisplayProps {
  questions: Question[];
  mode: 'view' | 'exam';
  showActions?: boolean;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onView?: (question: Question) => void;
  className?: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questions,
  mode,
  showActions = false,
  onEdit,
  onDelete,
  onView,
  className = ''
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'private': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'public': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'under_review': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (questions.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">Tidak ada soal untuk ditampilkan</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {questions.map((question, index) => (
        <div key={question._id} className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-lg font-semibold text-gray-900">
                  Soal {index + 1}
                </span>
                <span className="text-sm text-gray-500">
                  ID: {question._id.slice(-8)}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getTypeLabel(question.question_type)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {getDifficultyLabel(question.difficulty)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {question.points} poin
                </span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(question.status)}
                  <span className="text-xs text-gray-600 capitalize">
                    {question.status === 'private' ? 'Pribadi' : 
                     question.status === 'public' ? 'Publik' :
                     question.status === 'under_review' ? 'Review' : question.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-2 ml-4">
                {onView && (
                  <button
                    onClick={() => onView(question)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(question)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                    title="Edit Soal"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(question)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="mb-4">
            <div className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
              {question.question_text}
            </div>
          </div>

          {/* Options (for multiple choice) */}
          {question.question_type === 'multiple_choice' && question.options && question.options.length > 0 && (
            <div className="mb-4">
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={option.id || optionIndex}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
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
                      <p className={`text-sm ${option.is_correct ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                        {option.text}
                      </p>
                      {option.is_correct && (
                        <p className="text-xs text-green-600 mt-1 flex items-center">
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

          {/* Essay note */}
          {question.question_type === 'essay' && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Soal Essay</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Soal ini memerlukan jawaban dalam bentuk teks panjang dan akan dinilai secara manual.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuestionDisplay;