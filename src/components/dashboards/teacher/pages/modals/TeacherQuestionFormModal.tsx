import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Plus, Trash2, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TeachingClass } from '@/services/teacher';
import { 
  questionBankService, 
  Question, 
  CreateQuestionRequest, 
  UpdateQuestionRequest,
  QuestionOption 
} from '@/services/questionBank';
import toast from 'react-hot-toast';

interface TeacherQuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachingClasses: TeachingClass[];
  currentUserId: string;
  question?: Question;
}

const TeacherQuestionFormModal: React.FC<TeacherQuestionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teachingClasses,
  currentUserId,
  question
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEdit = !!question;
  
  // Form state - persistent fields (won't reset after successful creation)
  const [persistentFields, setPersistentFields] = useState({
    subject_id: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'essay',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    points: 10,
    status: 'private' as 'private' | 'public'
  });
  
  // Form state - resettable fields (will reset after successful creation)
  const [resettableFields, setResettableFields] = useState({
    question_text: '',
    options: [
      { id: '1', text: '', is_correct: false },
      { id: '2', text: '', is_correct: false },
      { id: '3', text: '', is_correct: false },
      { id: '4', text: '', is_correct: false }
    ] as QuestionOption[],
    tags: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEdit && question) {
      // For edit mode, populate all fields
      setPersistentFields({
        subject_id: question.subject_id,
        question_type: question.question_type,
        difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
        points: question.points,
        status: question.status as 'private' | 'public'
      });
      
      setResettableFields({
        question_text: question.question_text,
        options: question.options.length > 0 ? question.options : [
          { id: '1', text: '', is_correct: false },
          { id: '2', text: '', is_correct: false },
          { id: '3', text: '', is_correct: false },
          { id: '4', text: '', is_correct: false }
        ],
        tags: question.tags
      });
    } else if (!isEdit) {
      // For create mode, set default subject if available
      if (teachingClasses.length > 0 && teachingClasses[0].assignments.length > 0 && !persistentFields.subject_id) {
        setPersistentFields(prev => ({
          ...prev,
          subject_id: teachingClasses[0].assignments[0].subject_id
        }));
      }
    }
  }, [isEdit, question, teachingClasses]);

  const handlePersistentFieldChange = (field: keyof typeof persistentFields, value: any) => {
    setPersistentFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResettableFieldChange = (field: keyof typeof resettableFields, value: any) => {
    setResettableFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: any) => {
    const newOptions = [...resettableFields.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // If setting is_correct to true, set others to false (single correct answer)
    if (field === 'is_correct' && value === true) {
      newOptions.forEach((option, i) => {
        if (i !== index) {
          option.is_correct = false;
        }
      });
    }
    
    handleResettableFieldChange('options', newOptions);
  };

  const addOption = () => {
    const newOption: QuestionOption = {
      id: (resettableFields.options.length + 1).toString(),
      text: '',
      is_correct: false
    };
    handleResettableFieldChange('options', [...resettableFields.options, newOption]);
  };

  const removeOption = (index: number) => {
    if (resettableFields.options.length > 2) {
      const newOptions = resettableFields.options.filter((_, i) => i !== index);
      handleResettableFieldChange('options', newOptions);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !resettableFields.tags.includes(newTag.trim())) {
      handleResettableFieldChange('tags', [...resettableFields.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleResettableFieldChange('tags', resettableFields.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    // Validation
    if (!resettableFields.question_text.trim()) {
      toast.error('Teks soal harus diisi');
      return;
    }

    if (!persistentFields.subject_id) {
      toast.error('Pilih mata pelajaran');
      return;
    }

    if (persistentFields.question_type === 'multiple_choice') {
      const validOptions = resettableFields.options.filter(opt => opt.text.trim());
      if (validOptions.length < 2) {
        toast.error('Minimal harus ada 2 pilihan jawaban');
        return;
      }
      
      const correctOptions = validOptions.filter(opt => opt.is_correct);
      if (correctOptions.length !== 1) {
        toast.error('Harus ada tepat 1 jawaban yang benar');
        return;
      }
    }

    if (persistentFields.points <= 0) {
      toast.error('Poin harus lebih dari 0');
      return;
    }

    setLoading(true);
    try {
      const formData = {
        ...persistentFields,
        ...resettableFields,
        created_by_teacher_id: currentUserId,
        options: persistentFields.question_type === 'multiple_choice' 
          ? resettableFields.options.filter(opt => opt.text.trim())
          : []
      };

      if (isEdit && question) {
        const updateData: UpdateQuestionRequest = {
          subject_id: formData.subject_id,
          question_type: formData.question_type,
          difficulty: formData.difficulty,
          question_text: formData.question_text,
          options: formData.options,
          points: formData.points,
          tags: formData.tags
        };
        await questionBankService.updateQuestion(token, question._id, updateData);
        toast.success('Soal berhasil diperbarui');
      } else {
        const createData: CreateQuestionRequest = formData;
        await questionBankService.createQuestion(token, createData);
        toast.success('Soal berhasil dibuat');
        
        // Reset only resettable fields for create mode
        setResettableFields({
          question_text: '',
          options: [
            { id: '1', text: '', is_correct: false },
            { id: '2', text: '', is_correct: false },
            { id: '3', text: '', is_correct: false },
            { id: '4', text: '', is_correct: false }
          ],
          tags: []
        });
        setNewTag('');
        
        // Don't close modal, let user create more questions
        return;
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan soal';
      toast.error(errorMessage);
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get available subjects from teaching classes
  const availableSubjects = teachingClasses.flatMap(tc => 
    tc.assignments.map(assignment => ({
      id: assignment.subject_id,
      name: assignment.name,
      code: assignment.code
    }))
  ).filter((subject, index, self) => 
    index === self.findIndex(s => s.id === subject.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Soal' : 'Buat Soal Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Perbarui informasi soal' : 'Buat soal untuk bank soal Anda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Persistent Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Pengaturan Soal
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran *
                </label>
                <select
                  value={persistentFields.subject_id}
                  onChange={(e) => handlePersistentFieldChange('subject_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                  required
                >
                  <option value="">Pilih mata pelajaran</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Soal *
                </label>
                <select
                  value={persistentFields.question_type}
                  onChange={(e) => handlePersistentFieldChange('question_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                  required
                >
                  <option value="multiple_choice">Pilihan Ganda</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kesulitan *
                </label>
                <select
                  value={persistentFields.difficulty}
                  onChange={(e) => handlePersistentFieldChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                  required
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poin *
                </label>
                <input
                  type="number"
                  value={persistentFields.points}
                  onChange={(e) => handlePersistentFieldChange('points', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Soal
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="private"
                    checked={persistentFields.status === 'private'}
                    onChange={(e) => handlePersistentFieldChange('status', e.target.value)}
                    className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pribadi</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="public"
                    checked={persistentFields.status === 'public'}
                    onChange={(e) => handlePersistentFieldChange('status', e.target.value)}
                    className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Publik</span>
                </label>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Konten Soal
            </h3>
            
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teks Soal *
              </label>
              <textarea
                value={resettableFields.question_text}
                onChange={(e) => handleResettableFieldChange('question_text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                rows={4}
                placeholder="Masukkan teks soal..."
                required
              />
            </div>

            {/* Options (only for multiple choice) */}
            {persistentFields.question_type === 'multiple_choice' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Pilihan Jawaban *
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pilihan</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {resettableFields.options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={option.is_correct}
                        onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                          placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                      {resettableFields.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pilih satu jawaban yang benar dengan mencentang radio button
                </p>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Soal
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                  placeholder="Masukkan tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  Tambah
                </button>
              </div>
              
              {resettableFields.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {resettableFields.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips Membuat Soal</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Setelah berhasil membuat soal, form akan direset untuk soal berikutnya</li>
                    <li>• Pengaturan soal (mata pelajaran, tipe, kesulitan, dll) akan tetap tersimpan</li>
                    <li>• Untuk soal essay, pilihan jawaban akan dinonaktifkan</li>
                    <li>• Gunakan tag untuk memudahkan pencarian soal</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {isEdit ? 'Batal' : 'Tutup'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{isEdit ? 'Memperbarui...' : 'Menyimpan...'}</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4" />
                  <span>{isEdit ? 'Perbarui Soal' : 'Simpan Soal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherQuestionFormModal;