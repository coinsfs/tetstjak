import React from 'react';
import { X, HelpCircle, BookOpen, Tag, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Question } from '@/services/questionBank';
import { TeachingClass } from '@/services/teacher';

interface TeacherQuestionDetailModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  teachingClasses: TeachingClass[];
}

const TeacherQuestionDetailModal: React.FC<TeacherQuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose,
  teachingClasses
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

  const getSubjectName = (subjectId: string) => {
    const subject = teachingClasses.flatMap(tc => 
      tc.assignments.map(assignment => ({
        id: assignment.subject_id,
        name: assignment.name,
        code: assignment.code
      }))
    ).find(s => s.id === subjectId);
    
    return subject ? `${subject.name} (${subject.code})` : 'Mata Pelajaran Tidak Ditemukan';
  };

  if (!isOpen) return null;

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
              <h2 className="text-xl font-semibold text-gray-900">Detail Soal</h2>
              <p className="text-sm text-gray-500">Informasi lengkap soal</p>
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informasi Soal
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">ID Soal</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{question._id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mata Pelajaran</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{getSubjectName(question.subject_id)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tipe Soal</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {getTypeLabel(question.question_type)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Tingkat Kesulitan</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(question.difficulty)}`}>
                      {getDifficultyLabel(question.difficulty)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Poin</p>
                    <p className="text-lg font-semibold text-gray-900">{question.points}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(question.status)}
                      <span className="text-sm text-gray-700 capitalize">
                        {question.status === 'private' ? 'Pribadi' : 
                         question.status === 'public' ? 'Publik' :
                         question.status === 'under_review' ? 'Review' : question.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Tag Soal
              </h3>
              
              {question.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Tidak ada tag</p>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konten Soal
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Teks Soal:</h4>
              <div className="text-gray-900 whitespace-pre-wrap break-words">
                {question.question_text}
              </div>
            </div>

            {/* Options (for multiple choice) */}
            {question.question_type === 'multiple_choice' && question.options.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Pilihan Jawaban:</h4>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        option.is_correct 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        option.is_correct 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${option.is_correct ? 'text-green-900 font-medium' : 'text-gray-900'}`}>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Soal Essay</h4>
                    <p className="text-sm text-blue-700">
                      Soal ini bertipe essay dan memerlukan jawaban dalam bentuk teks panjang. 
                      Penilaian akan dilakukan secara manual oleh guru.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
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

export default TeacherQuestionDetailModal;