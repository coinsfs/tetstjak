import React, { useState, useEffect } from 'react';
import { X, School, Save, Loader } from 'lucide-react';
import { Class, CreateClassRequest, UpdateClassRequest, TeacherResponse } from '@/types/class';
import { ExpertiseProgram } from '@/types/common';
import { Teacher } from '@/types/user';
import { classService } from '@/services/class';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface ClassFormModalProps {
  classData?: Class | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({
  classData,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [formData, setFormData] = useState({
    grade_level: 10,
    expertise_id: '',
    name: '',
    academic_year: '',
    homeroom_teacher_id: ''
  });

  useEffect(() => {
    if (isOpen && token) {
      fetchFormData();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (classData) {
      setFormData({
        grade_level: classData.grade_level,
        expertise_id: classData.expertise_id,
        name: classData.name,
        academic_year: classData.academic_year,
        homeroom_teacher_id: classData.homeroom_teacher_id
      });
    } else {
      // Reset form for new class
      const currentYear = new Date().getFullYear();
      setFormData({
        grade_level: 10,
        expertise_id: '',
        name: '',
        academic_year: `${currentYear}/${currentYear + 1}`,
        homeroom_teacher_id: ''
      });
    }
  }, [classData]);

  const fetchFormData = async () => {
    if (!token) return;

    try {
      const [expertiseData, teacherData] = await Promise.all([
        classService.getExpertisePrograms(token),
        classService.getTeachers(token)
      ]);

      setExpertisePrograms(expertiseData);
      setTeachers(Array.isArray(teacherData.data) ? teacherData.data : []);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Gagal memuat data form');
      setExpertisePrograms([]);
      setTeachers([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama kelas harus diisi');
      return;
    }

    if (!formData.expertise_id) {
      toast.error('Jurusan harus dipilih');
      return;
    }

    if (!formData.academic_year.trim()) {
      toast.error('Tahun ajaran harus diisi');
      return;
    }

    if (!formData.homeroom_teacher_id) {
      toast.error('Wali kelas harus dipilih');
      return;
    }

    setLoading(true);
    try {
      if (classData) {
        // Update existing class
        const updateData: UpdateClassRequest = {
          grade_level: formData.grade_level,
          expertise_id: formData.expertise_id,
          name: formData.name.trim(),
          academic_year: formData.academic_year.trim(),
          homeroom_teacher_id: formData.homeroom_teacher_id
        };
        
        await classService.updateClass(token, classData._id, updateData);
        toast.success('Kelas berhasil diperbarui');
      } else {
        // Create new class
        const createData: CreateClassRequest = {
          grade_level: formData.grade_level,
          expertise_id: formData.expertise_id,
          name: formData.name.trim(),
          academic_year: formData.academic_year.trim(),
          homeroom_teacher_id: formData.homeroom_teacher_id
        };
        
        await classService.createClass(token, createData);
        toast.success('Kelas baru berhasil ditambahkan');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
      console.error('Error saving class:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!classData;

  // Generate academic years (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    academicYears.push(`${i}/${i + 1}`);
  }

  // Filter available teachers (those who are not already homeroom teachers)
  const availableTeachers = teachers.filter(teacher => teacher.is_active);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <School className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Kelas' : 'Tambah Kelas Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Perbarui informasi kelas' : 'Masukkan data kelas baru'}
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
              Informasi Kelas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={10}>Kelas X</option>
                  <option value={11}>Kelas XI</option>
                  <option value={12}>Kelas XII</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: 1, 2, A, B"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurusan <span className="text-red-500">*</span>
                </label>
                <select
                  name="expertise_id"
                  value={formData.expertise_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Jurusan</option>
                  {expertisePrograms.map((expertise) => (
                    <option key={expertise._id} value={expertise._id}>
                      {expertise.abbreviation} - {expertise.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wali Kelas <span className="text-red-500">*</span>
              </label>
              <select
                name="homeroom_teacher_id"
                value={formData.homeroom_teacher_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Wali Kelas</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.profile_details?.full_name || teacher.login_id}
                  </option>
                ))}
              </select>
              {availableTeachers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Tidak ada guru yang tersedia sebagai wali kelas
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

export default ClassFormModal;