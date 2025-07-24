import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Save, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ExpertiseProgram, CreateExpertiseProgramRequest, UpdateExpertiseProgramRequest } from '@/types/expertise';
import { Teacher } from '@/types/user';
import { expertiseProgramService } from '@/services/expertise';
import { userService } from '@/services/user';
import toast from 'react-hot-toast';

interface ExpertiseProgramFormModalProps {
  expertiseProgram?: ExpertiseProgram | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ExpertiseProgramFormModal: React.FC<ExpertiseProgramFormModalProps> = ({
  expertiseProgram,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    head_of_department_id: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!expertiseProgram;

  // Load teachers data
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!token || !isOpen) return;

      try {
        setTeachersLoading(true);
        const response = await userService.getTeachers(token, { limit: 100 });
        setTeachers(response.data as Teacher[]);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Gagal memuat data guru');
      } finally {
        setTeachersLoading(false);
      }
    };

    fetchTeachers();
  }, [token, isOpen]);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (expertiseProgram) {
        setFormData({
          name: expertiseProgram.name,
          abbreviation: expertiseProgram.abbreviation,
          description: expertiseProgram.description,
          head_of_department_id: expertiseProgram.head_of_department_id
        });
      } else {
        setFormData({
          name: '',
          abbreviation: '',
          description: '',
          head_of_department_id: ''
        });
      }
      setErrors({});
    }
  }, [expertiseProgram, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama jurusan wajib diisi';
    }

    if (!formData.abbreviation.trim()) {
      newErrors.abbreviation = 'Singkatan wajib diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi wajib diisi';
    }

    if (!formData.head_of_department_id) {
      newErrors.head_of_department_id = 'Kepala jurusan wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !validateForm()) return;

    try {
      setLoading(true);

      if (isEditing && expertiseProgram) {
        const updateData: UpdateExpertiseProgramRequest = {
          name: formData.name.trim(),
          abbreviation: formData.abbreviation.trim(),
          description: formData.description.trim(),
          head_of_department_id: formData.head_of_department_id
        };

        await expertiseProgramService.updateExpertiseProgram(token, expertiseProgram._id, updateData);
        toast.success('Jurusan berhasil diperbarui');
      } else {
        const createData: CreateExpertiseProgramRequest = {
          name: formData.name.trim(),
          abbreviation: formData.abbreviation.trim(),
          description: formData.description.trim(),
          head_of_department_id: formData.head_of_department_id
        };

        await expertiseProgramService.createExpertiseProgram(token, createData);
        toast.success('Jurusan berhasil ditambahkan');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
      console.error('Error saving expertise program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Jurusan' : 'Tambah Jurusan'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Perbarui informasi jurusan' : 'Tambahkan jurusan baru'}
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
            <h3 className="text-lg font-medium text-gray-900">Informasi Dasar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Jurusan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Jurusan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: Teknik Komputer dan Jaringan"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Singkatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Singkatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.abbreviation}
                  onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.abbreviation ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: TKJ"
                />
                {errors.abbreviation && (
                  <p className="mt-1 text-sm text-red-600">{errors.abbreviation}</p>
                )}
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Deskripsi program keahlian..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Kepala Jurusan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kepala Jurusan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.head_of_department_id}
                onChange={(e) => handleInputChange('head_of_department_id', e.target.value)}
                disabled={teachersLoading}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.head_of_department_id ? 'border-red-300' : 'border-gray-300'
                } ${teachersLoading ? 'bg-gray-50' : ''}`}
              >
                <option value="">
                  {teachersLoading ? 'Memuat data guru...' : 'Pilih kepala jurusan'}
                </option>
                {!teachersLoading && teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.profile_details?.full_name || teacher.login_id}
                  </option>
                ))}
              </select>
              {errors.head_of_department_id && (
                <p className="mt-1 text-sm text-red-600">{errors.head_of_department_id}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || teachersLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{isEditing ? 'Memperbarui...' : 'Menyimpan...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Perbarui' : 'Simpan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpertiseProgramFormModal;