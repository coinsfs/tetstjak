import React, { useState, useEffect } from 'react';
import { X, User, Save, Loader } from 'lucide-react';
import { Student, CreateStudentRequest, UpdateStudentRequest } from '@/types/user';
import { ExpertiseProgram } from '@/types/common';
import { ClassDetails } from '@/types/user';
import { userService } from '@/services/user';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface StudentFormModalProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [classes, setClasses] = useState<ClassDetails[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassDetails[]>([]);

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
      class_id: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 3
    }
  });

  // Filter helpers for UI
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');
  const [selectedExpertiseId, setSelectedExpertiseId] = useState<string>('');

  useEffect(() => {
    if (isOpen && token) {
      fetchFormData();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (student) {
      setFormData({
        login_id: student.login_id,
        email: student.email,
        is_active: student.is_active,
        profile: {
          full_name: student.profile_details?.full_name || '',
          gender: student.profile_details?.gender || 'Laki Laki',
          birth_date: student.profile_details?.birth_date ? 
            new Date(student.profile_details.birth_date).toISOString().split('T')[0] : '',
          birth_place: student.profile_details?.birth_place || '',
          address: student.profile_details?.address || '',
          phone_number: student.profile_details?.phone_number || '',
          class_id: student.class_details?._id || '',
          start_year: student.profile_details?.start_year || new Date().getFullYear(),
          end_year: student.profile_details?.end_year || new Date().getFullYear() + 3
        }
      });

      // Set filter helpers based on existing class
      if (student.class_details) {
        setSelectedGradeLevel(student.class_details.grade_level.toString());
        setSelectedExpertiseId(student.class_details.expertise_id);
      }
    } else {
      // Reset form for new student
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
          class_id: '',
          start_year: new Date().getFullYear(),
          end_year: new Date().getFullYear() + 3
        }
      });
      setSelectedGradeLevel('');
      setSelectedExpertiseId('');
    }
  }, [student]);

  useEffect(() => {
    // Filter classes based on selected grade level and expertise
    let filtered = classes;

    if (selectedGradeLevel) {
      filtered = filtered.filter(cls => cls.grade_level.toString() === selectedGradeLevel);
    }

    if (selectedExpertiseId) {
      filtered = filtered.filter(cls => cls.expertise_id === selectedExpertiseId);
    }

    setFilteredClasses(filtered);

    // Reset class selection if current selection is not in filtered results
    if (formData.profile.class_id && !filtered.find(cls => cls._id === formData.profile.class_id)) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          class_id: ''
        }
      }));
    }
  }, [classes, selectedGradeLevel, selectedExpertiseId, formData.profile.class_id]);

  const fetchFormData = async () => {
    if (!token) return;

    try {
      const [expertiseData, classData] = await Promise.all([
        userService.getExpertisePrograms(token),
        userService.getClasses(token)
      ]);

      setExpertisePrograms(expertiseData);
      setClasses(Array.isArray(classData) ? classData : []);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Gagal memuat data form');
      setExpertisePrograms([]);
      setClasses([]);
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

  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeLevel = e.target.value;
    setSelectedGradeLevel(gradeLevel);
  };

  const handleExpertiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const expertiseId = e.target.value;
    setSelectedExpertiseId(expertiseId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    if (!formData.profile.full_name.trim()) {
      toast.error('Nama lengkap harus diisi');
      return;
    }

    setLoading(true);
    try {
      if (student) {
        // Update existing student
        const updateData: UpdateStudentRequest = {
          login_id: formData.login_id,
          email: formData.email,
          is_active: formData.is_active,
          roles: ['student'],
          profile: {
            ...formData.profile,
            class_id: formData.profile.class_id || undefined
          }
        };
        
        await userService.updateStudent(token, student._id, updateData);
        toast.success('Data siswa berhasil diperbarui');
      } else {
        // Create new student
        const createData: CreateStudentRequest = {
          login_id: formData.login_id,
          email: formData.email,
          roles: ['student'],
          is_active: formData.is_active,
          profile: {
            ...formData.profile,
            class_id: formData.profile.class_id || undefined
          }
        };
        
        await userService.createStudent(token, createData);
        toast.success('Siswa baru berhasil ditambahkan');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
      console.error('Error saving student:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!student;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Siswa' : 'Tambah Siswa Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Perbarui informasi siswa' : 'Masukkan data siswa baru'}
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
                  NIS <span className="text-red-500">*</span>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Masuk
                </label>
                <input
                  type="number"
                  name="profile.start_year"
                  value={formData.profile.start_year}
                  onChange={handleInputChange}
                  min="2020"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Lulus
                </label>
                <input
                  type="number"
                  name="profile.end_year"
                  value={formData.profile.end_year}
                  onChange={handleInputChange}
                  min="2020"
                  max="2035"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Class Selection Filters */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Filter Kelas</h4>
              <p className="text-xs text-blue-700 mb-3">
                Pilih tingkat kelas dan jurusan untuk mempermudah pencarian kelas yang sesuai
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Tingkat Kelas
                  </label>
                  <select
                    value={selectedGradeLevel}
                    onChange={handleGradeLevelChange}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Tingkat</option>
                    <option value="10">Kelas X</option>
                    <option value="11">Kelas XI</option>
                    <option value="12">Kelas XII</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Jurusan
                  </label>
                  <select
                    value={selectedExpertiseId}
                    onChange={handleExpertiseChange}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Jurusan</option>
                    {expertisePrograms.map((expertise) => (
                      <option key={expertise._id} value={expertise._id}>
                        {expertise.abbreviation} - {expertise.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas
              </label>
              <select
                name="profile.class_id"
                value={formData.profile.class_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={filteredClasses.length === 0}
              >
                <option value="">Pilih Kelas</option>
                {filteredClasses.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.grade_level} {cls.expertise_details?.abbreviation} {cls.name} - {cls.academic_year}
                  </option>
                ))}
              </select>
              {filteredClasses.length === 0 && selectedGradeLevel && selectedExpertiseId && (
                <p className="text-sm text-gray-500 mt-1">
                  Tidak ada kelas tersedia untuk tingkat dan jurusan yang dipilih
                </p>
              )}
              {!selectedGradeLevel && !selectedExpertiseId && (
                <p className="text-sm text-gray-500 mt-1">
                  Pilih tingkat kelas dan jurusan terlebih dahulu untuk melihat daftar kelas
                </p>
              )}
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

export default StudentFormModal;