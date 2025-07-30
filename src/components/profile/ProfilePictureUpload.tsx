import React, { useRef, useState } from 'react';
import { Camera, Upload, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile';
import { getProfileImageUrl } from '@/constants/config';
import toast from 'react-hot-toast';

interface ProfilePictureUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadText?: boolean;
  className?: string;
  onUploadSuccess?: () => void;
  disabled?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  size = 'lg',
  showUploadText = true,
  className = '',
  onUploadSuccess,
  disabled = false
}) => {
  const { user, token, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const cameraSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const profileImageUrl = user?.profile_details?.profile_picture_key 
    ? getProfileImageUrl(user.profile_details.profile_picture_key)
    : null;

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return 'Format file tidak didukung. Gunakan JPG, PNG, atau GIF';
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return 'Ukuran file maksimal 2MB';
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    
    try {
      const response = await profileService.uploadProfilePicture(token, file);
      toast.success('Foto profil berhasil diperbarui');
      setUploadSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        // Try to refresh user data first
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // Fallback to page reload
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload foto profil';
      toast.error(errorMessage);
      console.error('Error uploading profile picture:', error);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      } else {
      }
      
      // Reset success state after 3 seconds
      if (uploadSuccess) {
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Profile Picture */}
      <div className={`${sizeClasses[size]} relative`}>
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt="Profile"
            className={`${sizeClasses[size]} rounded-full border-4 border-white shadow-lg object-cover transition-opacity group-hover:opacity-75`}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-opacity group-hover:opacity-75`}>
            <User className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}

        {/* Upload Button Overlay */}
        <button
          onClick={handleClick}
          disabled={uploading || disabled}
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed ${
            disabled ? 'opacity-50' : ''
          }`}
          title="Ubah foto profil"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          ) : uploadSuccess ? (
            <CheckCircle className={`${cameraSizes[size]} text-green-400 opacity-100`} />
          ) : (
            <Camera className={`${cameraSizes[size]} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
          )}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Upload Instructions */}
      {showUploadText && (
        <div className="mt-2 text-center">
          <button
            onClick={handleClick}
            disabled={uploading || disabled}
            className={`inline-flex items-center space-x-1 text-xs transition-colors disabled:opacity-50 ${
              uploadSuccess 
                ? 'text-green-600 hover:text-green-800' 
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                <span>Mengupload...</span>
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Berhasil diperbarui</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                <span>Ubah foto profil</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, GIF • Maksimal 2MB
          </p>
          
          {/* Error state */}
          {!uploading && !uploadSuccess && (
            <div className="mt-1">
              <p className="text-xs text-gray-400">
                Klik foto atau tombol di atas untuk mengubah
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;