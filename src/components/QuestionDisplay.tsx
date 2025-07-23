import React from 'react';
import { CheckCircle, Circle, FileText, Edit3 } from 'lucide-react';
import { Question } from '@/types/exam';

interface QuestionDisplayProps {
  questions: Question[];
  mode: 'view' | 'exam' | 'review';
  answers?: { [questionId: string]: string | string[] };
  onAnswerChange?: (questionId: string, answer: string | string[]) => void;
  showCorrectAnswers?: boolean;
  className?: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questions,
  mode = 'view',
  answers = {},
  onAnswerChange,
  showCorrectAnswers = false,
  className = ''
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleMultipleChoiceAnswer = (questionId: string, optionId: string) => {
    if (mode === 'exam' && onAnswerChange) {
      onAnswerChange(questionId, optionId);
    }
  };

  const handleEssayAnswer = (questionId: string, text: string) => {
    if (mode === 'exam' && onAnswerChange) {
      onAnswerChange(questionId, text);
    }
  };

  const getOptionStyle = (question: Question, option: any, isSelected: boolean) => {
    if (mode === 'view' || showCorrectAnswers) {
      if (option.is_correct) {
        return 'bg-green-50 border-green-200 text-green-900';
      }
      if (isSelected && !option.is_correct) {
        return 'bg-red-50 border-red-200 text-red-900';
      }
    }
    
    if (isSelected) {
      return 'bg-blue-50 border-blue-200 text-blue-900';
    }
    
    return 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100';
  };

  if (questions.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada soal</h4>
        <p className="text-gray-500">
          {mode === 'view' ? 'Ujian ini belum memiliki soal.' : 'Tidak ada soal yang tersedia.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {questions.map((question, index) => {
        const userAnswer = answers[question._id];
        
        return (
          <div key={question._id} className="border border-gray-200 rounded-lg p-6 bg-white">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                  {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    {question.points} poin
                  </span>
                </div>
              </div>
              
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <p className="text-base font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                {question.question_text}
              </p>
            </div>

            {/* Question Content Based on Type */}
            {question.question_type === 'multiple_choice' && question.options && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Pilih salah satu jawaban yang benar:
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = userAnswer === option.id;
                    const optionLetter = String.fromCharCode(65 + optionIndex);
                    
                    return (
                      <div 
                        key={option.id} 
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          getOptionStyle(question, option, isSelected)
                        } ${mode === 'exam' ? 'hover:shadow-sm' : ''}`}
                        onClick={() => mode === 'exam' ? handleMultipleChoiceAnswer(question._id, option.id) : undefined}
                      >
                        <div className="flex items-center">
                          {mode === 'exam' ? (
                            isSelected ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )
                          ) : (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                              option.is_correct 
                                ? 'bg-green-100 text-green-800' 
                                : isSelected && !option.is_correct
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {optionLetter}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-900 flex-1 leading-relaxed">
                          {option.text}
                        </span>
                        {(mode === 'view' || showCorrectAnswers) && option.is_correct && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {question.question_type === 'essay' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">
                    Jawab dengan kalimat lengkap dan jelas:
                  </p>
                </div>
                
                {mode === 'exam' ? (
                  <textarea
                    value={(userAnswer as string) || ''}
                    onChange={(e) => handleEssayAnswer(question._id, e.target.value)}
                    placeholder="Tulis jawaban Anda di sini..."
                    className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    rows={6}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Edit3 className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">Soal Essay</p>
                        <p className="text-sm text-yellow-700">
                          {mode === 'view' 
                            ? 'Jawaban akan dinilai secara manual oleh guru.' 
                            : userAnswer 
                            ? `Jawaban: ${userAnswer}`
                            : 'Belum dijawab'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Answer Status for Review Mode */}
            {mode === 'review' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status Jawaban:</span>
                  <span className={`font-medium ${
                    userAnswer 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {userAnswer ? 'Sudah Dijawab' : 'Belum Dijawab'}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuestionDisplay;