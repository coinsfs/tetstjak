import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile';
import toast from 'react-hot-toast';

const ChangePasswordForm: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Kata sandi saat ini wajib diisi';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'Kata sandi baru wajib diisi';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'Kata sandi baru minimal 6 karakter';
    }

    if (!formData.confirm_new_password) {
      newErrors.confirm_new_password = 'Konfirmasi kata sandi wajib diisi';
    } else if (formData.new_password !== formData.confirm_new_password) {
      newErrors.confirm_new_password = 'Konfirmasi kata sandi tidak cocok';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'Kata sandi baru harus berbeda dari kata sandi saat ini';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setIsLoading(true);
    
    try {
      await profileService.changePassword(token, formData);
      
      toast.success('Kata sandi berhasil diubah');
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah kata sandi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ubah Kata Sandi</h3>
            <p className="text-gray-600">Perbarui kata sandi akun Anda</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="current_password"
                name="current_password"
                value={formData.current_password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.current_password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Masukkan kata sandi saat ini"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="new_password"
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.new_password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Masukkan kata sandi baru"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Kata sandi minimal 6 karakter
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirm_new_password" className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirm_new_password"
                name="confirm_new_password"
                value={formData.confirm_new_password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.confirm_new_password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Konfirmasi kata sandi baru"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirm_new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_new_password}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengubah...</span>
                </div>
              ) : (
                'Ubah Kata Sandi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordForm;