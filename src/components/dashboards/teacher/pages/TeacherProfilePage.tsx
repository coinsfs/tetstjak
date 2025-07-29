import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile';
import { authService } from '@/services/auth';
import { getProfileImageUrl } from '@/constants/config';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Camera, 
  Save, 
  Lock, 
  Eye, 
  EyeOff,
  Upload,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherProfilePage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'picture'>('profile');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    phone_number: user?.profile_details?.phone_number || '',
    address: user?.profile_details?.address || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Picture upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email || '',
        phone_number: user.profile_details?.phone_number || '',
        address: user.profile_details?.address || ''
      });
    }
  }, [user]);

  const refreshUserData = async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      const updatedUser = await authService.getUserProfile(token);
      // Update user in context would require updating AuthContext
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      await profileService.updateProfile(token, {
        email: profileForm.email,
        profile: {
          phone_number: profileForm.phone_number,
          address: profileForm.address
        }
      });
      
      toast.success('Profile berhasil diperbarui');
      await refreshUserData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await profileService.changePassword(token, passwordForm);
      toast.success('Password berhasil diubah. Silakan login kembali.');
      
      // Clear form
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
      
      // Logout user after password change
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePictureUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    try {
      await profileService.uploadProfilePicture(token, selectedFile);
      toast.success('Foto profile berhasil diperbarui');
      
      // Clear selection
      setSelectedFile(null);
      setPreviewUrl(null);
      
      await refreshUserData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload foto profile';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const clearPictureSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const getCurrentProfileImage = () => {
    const profileUrl = user?.profile_details?.profile_picture_url;
    if (profileUrl) {
      return getProfileImageUrl(profileUrl);
    }
    return null;
  };

  const getInitials = () => {
    const fullName = user?.profile_details?.full_name || user?.login_id || 'U';
    return fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {getCurrentProfileImage() ? (
              <img
                src={getCurrentProfileImage()!}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-2xl font-bold text-green-700">{getInitials()}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.profile_details?.full_name || user.login_id}
            </h1>
            <p className="text-gray-600">Teacher Profile</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Building className="w-4 h-4 mr-1" />
                {user.department_details?.name || 'No Department'}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Bergabung {formatDate(user.created_at)}
              </span>
            </div>
          </div>

          {refreshing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm">Memperbarui...</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Informasi Profile</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Keamanan</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('picture')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'picture'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Foto Profile</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Personal</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Perbarui informasi personal Anda. Beberapa informasi tidak dapat diubah dan harus melalui administrator.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Read-only Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile_details?.full_name || '-'}</span>
                      <span className="text-xs text-gray-500 ml-auto">Tidak dapat diubah</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Login ID
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user.login_id}</span>
                      <span className="text-xs text-gray-500 ml-auto">Tidak dapat diubah</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {user.profile_details?.gender === 'male' ? 'Laki-laki' : 
                         user.profile_details?.gender === 'female' ? 'Perempuan' : '-'}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">Tidak dapat diubah</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {user.profile_details?.birth_date ? formatDate(user.profile_details.birth_date) : '-'}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">Tidak dapat diubah</span>
                    </div>
                  </div>
                </div>

                {/* Editable Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Informasi yang Dapat Diubah</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Masukkan email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={profileForm.phone_number}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                        placeholder="Masukkan alamat lengkap"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ubah Password</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Pastikan password baru Anda kuat dan tidak mudah ditebak. Setelah mengubah password, Anda akan diminta login kembali.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Masukkan password saat ini"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Masukkan password baru"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Konfirmasi password baru"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {passwordForm.new_password && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Tips Password Kuat:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center space-x-2">
                        {passwordForm.new_password.length >= 6 ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        }
                        <span>Minimal 6 karakter</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        {/[A-Z]/.test(passwordForm.new_password) ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        }
                        <span>Mengandung huruf besar</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        {/[0-9]/.test(passwordForm.new_password) ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        }
                        <span>Mengandung angka</span>
                      </li>
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Mengubah...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Ubah Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Picture Upload Tab */}
          {activeTab === 'picture' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Foto Profile</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Upload foto profile Anda. Foto akan ditampilkan di seluruh aplikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Picture */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Foto Saat Ini</h4>
                  <div className="flex flex-col items-center space-y-4">
                    {getCurrentProfileImage() ? (
                      <img
                        src={getCurrentProfileImage()!}
                        alt="Current Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200 shadow-lg">
                        <span className="text-3xl font-bold text-gray-400">{getInitials()}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 text-center">
                      {getCurrentProfileImage() ? 'Foto profile saat ini' : 'Belum ada foto profile'}
                    </p>
                  </div>
                </div>

                {/* Upload New Picture */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Upload Foto Baru</h4>
                  
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Upload foto profile</p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG hingga 2MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="picture-upload"
                      />
                      <label
                        htmlFor="picture-upload"
                        className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Pilih File</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <img
                            src={previewUrl!}
                            alt="Preview"
                            className="w-32 h-32 rounded-full object-cover border-4 border-green-200 shadow-lg"
                          />
                          <button
                            onClick={clearPictureSelection}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      {/* Upload Button */}
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePictureUpload}
                          disabled={uploading}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>Mengupload...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Foto</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={clearPictureSelection}
                          disabled={uploading}
                          className="px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Guidelines */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Panduan Upload Foto:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Format yang didukung: PNG, JPG, JPEG</li>
                      <li>• Ukuran maksimal: 2MB</li>
                      <li>• Resolusi yang disarankan: 400x400 pixel</li>
                      <li>• Foto akan dipotong menjadi bentuk lingkaran</li>
                      <li>• Gunakan foto dengan pencahayaan yang baik</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;