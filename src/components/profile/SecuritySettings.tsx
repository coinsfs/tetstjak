import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Loader2,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

const SecuritySettings: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRequirements = [
    { text: 'Minimal 8 karakter', check: (pwd: string) => pwd.length >= 8 },
    { text: 'Mengandung huruf besar', check: (pwd: string) => /[A-Z]/.test(pwd) },
    { text: 'Mengandung huruf kecil', check: (pwd: string) => /[a-z]/.test(pwd) },
    { text: 'Mengandung angka', check: (pwd: string) => /\d/.test(pwd) },
    { text: 'Mengandung karakter khusus (!@#$%^&*)', check: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Password saat ini wajib diisi';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'Password baru wajib diisi';
    } else {
      // Check password requirements
      const failedRequirements = passwordRequirements.filter(req => !req.check(formData.new_password));
      if (failedRequirements.length > 0) {
        newErrors.new_password = 'Password tidak memenuhi persyaratan keamanan';
      }
    }

    if (!formData.confirm_new_password) {
      newErrors.confirm_new_password = 'Konfirmasi password wajib diisi';
    } else if (formData.new_password !== formData.confirm_new_password) {
      newErrors.confirm_new_password = 'Konfirmasi password tidak cocok';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'Password baru harus berbeda dari password saat ini';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) return;

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.103.9:8000/api/v1'}/users/me/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
          confirm_new_password: formData.confirm_new_password
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Gagal mengubah password' }));
        throw new Error(error.detail || 'Gagal mengubah password');
      }

      toast.success('Password berhasil diubah');
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah password';
      toast.error(errorMessage);
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const getPasswordStrength = (password: string) => {
    const passedRequirements = passwordRequirements.filter(req => req.check(password)).length;
    const percentage = (passedRequirements / passwordRequirements.length) * 100;
    
    if (percentage < 40) return { label: 'Lemah', color: 'bg-red-500', textColor: 'text-red-600' };
    if (percentage < 80) return { label: 'Sedang', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { label: 'Kuat', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.new_password);

  return (
    <div className="max-w-full mx-auto space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Security Overview - Left Column */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 h-fit">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Keamanan Akun</h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Tips Keamanan</h4>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li>• Gunakan password yang unik dan kuat</li>
                    <li>• Jangan bagikan password Anda kepada siapapun</li>
                    <li>• Ubah password secara berkala untuk keamanan optimal</li>
                    <li>• Logout dari akun setelah selesai menggunakan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form - Right Column */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Key className="w-5 h-5 text-orange-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ubah Password</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Current Password */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Saat Ini <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={formData.current_password}
                      onChange={(e) => handleInputChange('current_password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.current_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan password saat ini"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.current_password}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={formData.new_password}
                      onChange={(e) => handleInputChange('new_password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.new_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan password baru"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.new_password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Kekuatan Password:</span>
                        <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ 
                            width: `${(passwordRequirements.filter(req => req.check(formData.new_password)).length / passwordRequirements.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {errors.new_password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.new_password}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirm_new_password}
                      onChange={(e) => handleInputChange('confirm_new_password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.confirm_new_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Konfirmasi password baru"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_new_password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirm_new_password}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3">Persyaratan Password:</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {passwordRequirements.map((requirement, index) => {
                    const isValid = formData.new_password ? requirement.check(formData.new_password) : false;
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        {isValid ? (
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border border-gray-300 rounded-full flex-shrink-0"></div>
                        )}
                        <span className={`text-xs sm:text-sm ${isValid ? 'text-green-700' : 'text-gray-600'}`}>
                          {requirement.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengubah Password...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Ubah Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;