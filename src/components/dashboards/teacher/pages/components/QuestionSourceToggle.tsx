import React from 'react';
import { User, Users, Send } from 'lucide-react';

type QuestionSource = 'my_questions' | 'submitted_questions' | 'my_submissions';

interface QuestionSourceToggleProps {
  questionSource: QuestionSource;
  onSourceChange: (source: QuestionSource) => void;
}

const QuestionSourceToggle: React.FC<QuestionSourceToggleProps> = ({
  questionSource,
  onSourceChange
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sumber Soal</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Left Group: My Questions & Submitted Questions */}
        <div className="flex rounded-lg bg-gray-100 p-1 flex-1 max-w-md">
          <button
            onClick={() => onSourceChange('my_questions')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              questionSource === 'my_questions' 
                ? 'bg-yellow-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Soal Saya</span>
          </button>
          <button
            onClick={() => onSourceChange('submitted_questions')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              questionSource === 'submitted_questions' 
                ? 'bg-yellow-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Soal Disubmit</span>
          </button>
        </div>

        {/* Right Group: My Submissions */}
        <div className="flex rounded-lg bg-gray-100 p-1 max-w-xs">
          <button
            onClick={() => onSourceChange('my_submissions')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              questionSource === 'my_submissions' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submission Saya</span>
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-2">
        {questionSource === 'my_questions' 
          ? 'Menampilkan soal yang Anda buat'
          : questionSource === 'submitted_questions'
          ? 'Menampilkan soal yang disubmit oleh guru lain untuk direview'
          : 'Menampilkan soal yang telah Anda submit ke koordinator'
        }
      </p>
    </div>
  );
};

export default QuestionSourceToggle;