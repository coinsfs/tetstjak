import React, { useState, useEffect } from 'react';
import { X, User, Save, Loader } from 'lucide-react';
import { Teacher, CreateTeacherRequest, UpdateTeacherRequest } from '@/types/user';
import { ExpertiseProgram } from '@/types/common';
import { userService } from '@/services/user';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface TeacherFormModalProps {
  teacher?: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  teacher,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<ExpertiseProgram[]>([]);

  const [formData, setFormData] = useState({
    login_id: '',
    email: '',
    is_active: true,
    profile: {
      full_name: '',
      gender: 'Laki Laki',
      birth_date: '',
      birth_place: '',
      address: '',
      phone_number: '',
      department_id: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 10
    }
  });

  useEffect(() => {
    if (isOpen && token) {
      fetchFormData();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (teacher) {
      setFormData({
        login_id: teacher.login_id,
        email: teacher.email,
        is_active: teacher.is_active,
        profile: {
          full_name: teacher.profile_details?.full_name || '',
          gender: teacher.profile_details?.gender || 'Laki Laki',
          birth_date: teacher.profile_details?.birth_date ? 
            new Date(teacher.profile_details.birth_date).toISOString().split('T')[0] : '',
          birth_place: teacher.profile_details?.birth_place || '',
          address: teacher.profile_details?.address || '',
          phone_number: teacher.profile_details?.phone_number || '',
          department_id: teacher.department_details?._id || '',
          start_year: teacher.profile_details?.start_year || new Date().getFullYear(),
          end_year: teacher.profile_details?.end_year || new Date().getFullYear() + 10
        }
      });
    } else {
      // Reset form for new teacher
      setFormData({
        login_id: '',
        email: '',
        is_active: true,
        profile: {
          full_name: '',
          gender: 'Laki Laki',
          birth_date: '',
          birth_place: '',
          address: '',
          phone_number: '',
          department_id: '',
          start_year: new Date().getFullYear(),
          end_year: new Date().getFullYear() + 10
        }
      });
    }
  }, [teacher]);

  const fetchFormData = async () => {
    if (!token) return;

    try {
      const departmentData = await userService.getDepartments(token);
      setDepartments(departmentData);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Gagal memuat data form');
      setDepartments([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.replace('profile.', '');
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: type === 'number' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    if (!formData.profile.full_name.trim()) {
      toast.error('Nama lengkap harus diisi');
      return;
    }

    if (!formData.profile.department_id) {
      toast.error('Jurusan harus dipilih');
      return;
    }

    setLoading(true);
    try {
      if (teacher) {
        // Update existing teacher
        const updateData: UpdateTeacherRequest = {
          login_id: formData.login_id,
          email: formData.email,
          is_active: formData.is_active,
          roles: ['teacher'],
          profile: formData.profile
        };
        
        await userService.updateTeacher(token, teacher._id, updateData);
        toast.success('Data guru berhasil diperbarui');
      } else {
        // Create new teacher
        const createData: CreateTeacherRequest = {
          login_id: formData.login_id,
          email: formData.email,
          roles: ['teacher'],
          is_active: formData.is_active,
          profile: formData.profile
        };
        
        await userService.createTeacher(token, createData);
        toast.success('Guru baru berhasil ditambahkan');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
      console.error('Error saving teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!teacher;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Guru' : 'Tambah Guru Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Perbarui informasi guru' : 'Masukkan data guru baru'}
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
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Akun
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NKTAM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="login_id"
                  value={formData.login_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Akun aktif
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Pribadi
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="profile.full_name"
                  value={formData.profile.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="profile.gender"
                  value={formData.profile.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Laki Laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="profile.birth_date"
                  value={formData.profile.birth_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="profile.birth_place"
                  value={formData.profile.birth_place}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="profile.phone_number"
                  value={formData.profile.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                name="profile.address"
                value={formData.profile.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Akademik
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurusan <span className="text-red-500">*</span>
                </label>
                <select
                  name="profile.department_id"
                  value={formData.profile.department_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Jurusan</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.abbreviation} - {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Mulai Mengajar
                </label>
                <input
                  type="number"
                  name="profile.start_year"
                  value={formData.profile.start_year}
                  onChange={handleInputChange}
                  min="2000"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Berakhir (Opsional)
                </label>
                <input
                  type="number"
                  name="profile.end_year"
                  value={formData.profile.end_year}
                  onChange={handleInputChange}
                  min="2000"
                  max="2040"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Menyimpan...' : (isEditing ? 'Perbarui' : 'Simpan')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherFormModal;