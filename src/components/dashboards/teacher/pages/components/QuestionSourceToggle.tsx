import React from 'react';
import { User, Send } from 'lucide-react';

type QuestionSource = 'my_questions' | 'my_submissions';

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
      
      {/* Toggle Switch */}
      <div className="flex rounded-full bg-gray-200 p-1">
        <button
          onClick={() => onSourceChange('my_questions')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-full transition-all duration-200 flex-1 justify-center ${
            questionSource === 'my_questions' 
              ? 'bg-white text-yellow-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Soal Saya</span>
        </button>
        
        <button
          onClick={() => onSourceChange('my_submissions')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-full transition-all duration-200 flex-1 justify-center ${
            questionSource === 'my_submissions' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Submission Saya</span>
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mt-2">
        {questionSource === 'my_questions' 
          ? 'Menampilkan soal yang Anda buat'
          : 'Menampilkan soal yang telah Anda submit ke koordinator'
        }
      </p>
    </div>
  );
};

export default QuestionSourceToggle;