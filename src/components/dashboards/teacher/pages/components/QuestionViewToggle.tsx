import React from 'react';
import { Table, BookOpen } from 'lucide-react';

interface QuestionViewToggleProps {
  currentView: 'table' | 'exam';
  onViewChange: (view: 'table' | 'exam') => void;
  totalItems: number;
  questionSource: 'my_questions' | 'my_submissions';
}

const QuestionViewToggle: React.FC<QuestionViewToggleProps> = ({
  currentView,
  onViewChange,
  totalItems,
  questionSource
}) => {
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'my_questions': return 'soal (soal Anda)';
      case 'my_submissions': return 'submission (Anda submit)';
      default: return 'item';
    }
  };

  return (
    <div className="py-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalItems} {getSourceLabel(questionSource)} ditemukan
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange('table')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              currentView === 'table' 
                ? 'bg-white text-yellow-600 shadow-sm border border-gray-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Tabel</span>
          </button>
          <button
            onClick={() => onViewChange('exam')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              currentView === 'exam' 
                ? 'bg-white text-yellow-600 shadow-sm border border-gray-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ujian</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionViewToggle;