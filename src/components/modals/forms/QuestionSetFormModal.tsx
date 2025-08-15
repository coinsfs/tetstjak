import React, { useState, useEffect } from 'react';
import { QuestionSet, CreateQuestionSetRequest, UpdateQuestionSetRequest } from '@/types/questionSet';
import { Subject } from '@/types/subject';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService } from '@/services/questionSet';
import { subjectService } from '@/services/subject';
import { X, BookOpen, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionSetFormModalProps {
  questionSet: QuestionSet | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuestionSetFormModal: React.FC<QuestionSetFormModalProps> = ({
  questionSet,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    grade_level: 10,
    description: '',
    is_public: false,
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!questionSet;

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      if (!token) return;

      try {
        const response = await subjectService.getSubjects(token, { limit: 1000 });
        setSubjects(response.data || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
        toast.error('Gagal memuat data mata pelajaran');
      }
    };

    if (isOpen) {
      loadSubjects();
    }
  }, [token, isOpen]);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (questionSet) {
        setFormData({
          name: questionSet.name,
          subject_id: questionSet.subject ? questionSet.subject.name : '', // We need to find the subject ID
          grade_level: questionSet.grade_level,
          description: questionSet.description,
          is_public: questionSet.is_public,
          tags: questionSet.metadata.tags || []
        });
      } else {
        setFormData({
          name: '',
          subject_id: '',
          grade_level: 10,
          description: '',
          is_public: false,
          tags: []
        });
      }
      setTagInput('');
      setErrors({});
    }
  }, [questionSet, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'grade_level') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama paket soal harus diisi';
    }

    if (!formData.subject_id) {
      newErrors.subject_id = 'Mata pelajaran harus dipilih';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setLoading(true);

    try {
      if (isEditing && questionSet) {
        const updateData: UpdateQuestionSetRequest = {
          name: formData.name.trim(),
          subject_id: formData.subject_id,
          grade_level: formData.grade_level,
          description: formData.description.trim(),
          is_public: formData.is_public,
          tags: formData.tags
        };

        await questionSetService.updateQuestionSet(token, questionSet._id, updateData);
        toast.success('Paket soal berhasil diperbarui');
      } else {
        const createData: CreateQuestionSetRequest = {
          name: formData.name.trim(),
          subject_id: formData.subject_id,
          grade_level: formData.grade_level,
          description: formData.description.trim(),
          is_public: formData.is_public,
          tags: formData.tags
        };

        await questionSetService.createQuestionSet(token, createData);
        toast.success('Paket soal berhasil dibuat');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
      console.error('Error saving question set:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Perbarui informasi paket soal' : 'Buat paket soal baru untuk bank soal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-80 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Paket Soal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama paket soal"
              />
              {errors.name && (
                <div className="flex items-center space-x-2 mt-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.name}</span>
                </div>
              )}
            </div>

            {/* Subject and Grade Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.subject_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {errors.subject_id && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.subject_id}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value={10}>Kelas X</option>
                  <option value={11}>Kelas XI</option>
                  <option value={12}>Kelas XII</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan deskripsi paket soal"
              />
              {errors.description && (
                <div className="flex items-center space-x-2 mt-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.description}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tambah
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Public/Private */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Jadikan paket soal ini publik (dapat diakses oleh guru lain)
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{isEditing ? 'Memperbarui...' : 'Membuat...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Perbarui' : 'Buat'} Paket Soal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetFormModal;