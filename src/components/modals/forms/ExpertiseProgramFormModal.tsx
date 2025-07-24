import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Save, Loader2 } from 'lucide-react';
import { ExpertiseProgram, CreateExpertiseProgramRequest, UpdateExpertiseProgramRequest } from '@/types/expertise';
import { Teacher } from '@/types/user';
import { expertiseProgramService } from '@/services/expertise';
import { userService } from '@/services/user';
import { useAuth } from '@/contexts/AuthContext';
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

  const isEdit = !!expertiseProgram;

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
      fetchTeachers();
    }
  }, [isOpen, expertiseProgram]);

  const fetchTeachers = async () => {
    if (!token) return;

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

  const validateForm = () => {
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
    
    if (!validateForm() || !token) return;

    try {
      setLoading(true);

      if (isEdit && expertiseProgram) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Jurusan' : 'Tambah Jurusan'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Perbarui informasi jurusan' : 'Tambahkan jurusan baru'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nama Jurusan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Jurusan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama jurusan"
              disabled={loading}
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
              onChange={(e) => handleInputChange('abbreviation', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.abbreviation ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan singkatan jurusan"
              disabled={loading}
              maxLength={10}
            />
            {errors.abbreviation && (
              <p className="mt-1 text-sm text-red-600">{errors.abbreviation}</p>
            )}
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
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-vertical ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan deskripsi jurusan"
              disabled={loading}
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
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.head_of_department_id ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || teachersLoading}
            >
              <option value="">
                {teachersLoading ? 'Memuat data guru...' : 'Pilih kepala jurusan'}
              </option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.profile_details?.full_name || teacher.login_id} - {teacher.login_id}
                </option>
              ))}
            </select>
            {errors.head_of_department_id && (
              <p className="mt-1 text-sm text-red-600">{errors.head_of_department_id}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEdit ? 'Memperbarui...' : 'Menyimpan...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Perbarui' : 'Simpan'}</span>
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