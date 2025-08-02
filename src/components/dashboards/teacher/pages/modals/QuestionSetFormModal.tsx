import React, { useState, useEffect } from 'react';
import { X, Package, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  questionSetService, 
  QuestionSet, 
  CreateQuestionSetRequest, 
  UpdateQuestionSetRequest,
  CoordinationAssignment 
} from '@/services/questionSet';
import toast from 'react-hot-toast';

interface QuestionSetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  myCoordinations: CoordinationAssignment[];
  questionSet?: QuestionSet | null;
}

const QuestionSetFormModal: React.FC<QuestionSetFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  myCoordinations,
  questionSet
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEdit = !!questionSet;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    grade_level: 10,
    description: '',
    is_public: false,
    tags: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEdit && questionSet) {
      setFormData({
        name: questionSet.name,
        subject_id: questionSet.subject.name, // We'll need to find the actual subject_id
        grade_level: questionSet.grade_level,
        description: questionSet.description,
        is_public: questionSet.is_public,
        tags: questionSet.metadata.tags
      });
    } else {
      // Set default coordination if available
      if (myCoordinations.length > 0) {
        setFormData(prev => ({
          ...prev,
          subject_id: myCoordinations[0].subject_id,
          grade_level: myCoordinations[0].grade_level
        }));
      }
    }
  }, [isEdit, questionSet, myCoordinations]);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleFieldChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleFieldChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama paket soal harus diisi');
      return;
    }

    if (!formData.subject_id) {
      toast.error('Pilih mata pelajaran');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Deskripsi harus diisi');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && questionSet) {
        const updateData: UpdateQuestionSetRequest = {
          name: formData.name,
          description: formData.description,
          is_public: formData.is_public,
          tags: formData.tags
        };
        await questionSetService.updateQuestionSet(token, questionSet._id, updateData);
        toast.success('Paket soal berhasil diperbarui');
      } else {
        const createData: CreateQuestionSetRequest = {
          name: formData.name,
          subject_id: formData.subject_id,
          grade_level: formData.grade_level,
          description: formData.description,
          is_public: formData.is_public,
          tags: formData.tags
        };
        await questionSetService.createQuestionSet(token, createData);
        toast.success('Paket soal berhasil dibuat');
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan paket soal';
      toast.error(errorMessage);
      console.error('Error saving question set:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  // Get available coordinations for the selected subject
  const availableGradeLevels = myCoordinations
    .filter(coord => coord.subject_id === formData.subject_id)
    .map(coord => coord.grade_level);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Perbarui informasi paket soal' : 'Buat paket soal untuk koordinasi Anda'}
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Dasar
            </h3>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Paket Soal *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Masukkan nama paket soal..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                rows={3}
                placeholder="Masukkan deskripsi paket soal..."
                required
              />
            </div>

            {/* Subject and Grade Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran *
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => {
                    handleFieldChange('subject_id', e.target.value);
                    // Reset grade level when subject changes
                    const newCoordination = myCoordinations.find(coord => coord.subject_id === e.target.value);
                    if (newCoordination) {
                      handleFieldChange('grade_level', newCoordination.grade_level);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                  disabled={isEdit} // Can't change subject in edit mode
                >
                  <option value="">Pilih mata pelajaran</option>
                  {myCoordinations.map((coord) => (
                    <option key={coord.coordination_assignment_id} value={coord.subject_id}>
                      {coord.subject_name} ({coord.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kelas *
                </label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => handleFieldChange('grade_level', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                  disabled={isEdit} // Can't change grade level in edit mode
                >
                  {availableGradeLevels.length > 0 ? (
                    availableGradeLevels.map((grade) => (
                      <option key={grade} value={grade}>
                        Kelas {getGradeLabel(grade)}
                      </option>
                    ))
                  ) : (
                    <option value="">Pilih mata pelajaran terlebih dahulu</option>
                  )}
                </select>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilitas
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="false"
                    checked={!formData.is_public}
                    onChange={(e) => handleFieldChange('is_public', false)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pribadi</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="true"
                    checked={formData.is_public}
                    onChange={(e) => handleFieldChange('is_public', true)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Publik</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Tag Paket Soal
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                  placeholder="Masukkan tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Tambah
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Informasi Paket Soal</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Paket soal yang dibuat akan kosong dan perlu diisi dengan soal</li>
                  <li>• Gunakan fitur "Kelola Soal" untuk menambahkan soal ke paket</li>
                  <li>• Paket soal publik dapat digunakan oleh guru lain</li>
                  <li>• Tag membantu dalam pencarian dan kategorisasi paket soal</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{isEdit ? 'Memperbarui...' : 'Membuat...'}</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>{isEdit ? 'Perbarui Paket Soal' : 'Buat Paket Soal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionSetFormModal;