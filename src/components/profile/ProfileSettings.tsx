import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user';
import { UpdateTeacherRequest, UpdateStudentRequest } from '@/types/user';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Building, 
  Save,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileFormData {
  login_id: string;
  email: string;
  profile: {
    full_name: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    address: string;
    phone_number: string;
    department_id?: string;
    class_id?: string;
    start_year?: number;
    end_year?: number;
  };
}

const ProfileSettings: React.FC = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    login_id: '',
    email: '',
    profile: {
      full_name: '',
      gender: '',
      birth_date: '',
      birth_place: '',
      address: '',
      phone_number: '',
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        login_id: user.login_id,
        email: user.email,
        profile: {
          full_name: user.profile_details?.full_name || '',
          gender: user.profile_details?.gender || '',
          birth_date: user.profile_details?.birth_date ? 
            new Date(user.profile_details.birth_date).toISOString().split('T')[0] : '',
          birth_place: user.profile_details?.birth_place || '',
          address: user.profile_details?.address || '',
          phone_number: user.profile_details?.phone_number || '',
          department_id: user.profile_details?.department_id || '',
          class_id: user.profile_details?.class_id || '',
          start_year: user.profile_details?.start_year || undefined,
          end_year: user.profile_details?.end_year || undefined,
        }
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.login_id.trim()) {
      newErrors.login_id = 'Login ID wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.profile.full_name.trim()) {
      newErrors.full_name = 'Nama lengkap wajib diisi';
    }

    if (!formData.profile.gender) {
      newErrors.gender = 'Jenis kelamin wajib dipilih';
    }

    if (!formData.profile.birth_date) {
      newErrors.birth_date = 'Tanggal lahir wajib diisi';
    }

    if (!formData.profile.phone_number.trim()) {
      newErrors.phone_number = 'Nomor telepon wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '');
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field.replace('profile.', '')]) {
      setErrors(prev => ({
        ...prev,
        [field.replace('profile.', '')]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !token) return;

    try {
      setLoading(true);

      // Prepare update data based on user role
      const updateData: UpdateTeacherRequest | UpdateStudentRequest = {
        login_id: formData.login_id,
        email: formData.email,
        profile: {
          full_name: formData.profile.full_name,
          gender: formData.profile.gender,
          birth_date: formData.profile.birth_date,
          birth_place: formData.profile.birth_place,
          address: formData.profile.address,
          phone_number: formData.profile.phone_number,
          start_year: formData.profile.start_year,
          end_year: formData.profile.end_year,
        }
      };

      // Add role-specific fields
      if (user.roles.includes('teacher') && formData.profile.department_id) {
        (updateData.profile as any).department_id = formData.profile.department_id;
      } else if (user.roles.includes('student') && formData.profile.class_id) {
        (updateData.profile as any).class_id = formData.profile.class_id;
      }

      // Update user profile
      if (user.roles.includes('teacher')) {
        await userService.updateTeacher(token, user._id, updateData as UpdateTeacherRequest);
      } else {
        await userService.updateStudent(token, user._id, updateData as UpdateStudentRequest);
      }

      toast.success('Profile berhasil diperbarui');
      
      // Optionally refresh user data here
      // You might want to add a method to refresh user data in AuthContext
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui profile';
      toast.error(errorMessage);
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pengaturan Profile</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.login_id}
                  onChange={(e) => handleInputChange('login_id', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.login_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan login ID"
                />
              </div>
              {errors.login_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.login_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Informasi Pribadi</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.profile.full_name}
                    onChange={(e) => handleInputChange('profile.full_name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.full_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.profile.gender}
                  onChange={(e) => handleInputChange('profile.gender', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.gender ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.gender}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.profile.birth_date}
                    onChange={(e) => handleInputChange('profile.birth_date', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.birth_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.birth_date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.birth_date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Lahir
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.profile.birth_place}
                    onChange={(e) => handleInputChange('profile.birth_place', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan tempat lahir"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.profile.address}
                    onChange={(e) => handleInputChange('profile.address', e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical min-h-[80px]"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.profile.phone_number}
                    onChange={(e) => handleInputChange('profile.phone_number', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.phone_number ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan nomor telepon"
                  />
                </div>
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone_number}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Masuk
                  </label>
                  <input
                    type="number"
                    value={formData.profile.start_year || ''}
                    onChange={(e) => handleInputChange('profile.start_year', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="2020"
                    min="1900"
                    max="2100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Keluar
                  </label>
                  <input
                    type="number"
                    value={formData.profile.end_year || ''}
                    onChange={(e) => handleInputChange('profile.end_year', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="2024"
                    min="1900"
                    max="2100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;