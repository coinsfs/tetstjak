import React from 'react';
import { UserProfile } from '@/types/auth';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { getProfileImageUrl } from '@/constants/config';
import StudentAccountSettingsPage from './StudentAccountSettingsPage';

interface StudentProfilePageProps {
  user: UserProfile | null;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ user }) => {
  const getProfileImage = () => {
    const profileUrl = user?.profile_details?.profile_picture_k;
    if (profileUrl) {
      const fullUrl = getProfileImageUrl(profileUrl);
      return fullUrl;
    }
    return null;
  };

  const getInitials = () => {
    const fullName = user?.profile_details?.full_name || user?.login_id || 'S';
    return fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            <p className="text-gray-600">Informasi pribadi dan pengaturan akun</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative">
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()!}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200 ${getProfileImage() ? 'hidden' : ''}`}>
                  <span className="text-xl font-semibold text-blue-700">
                    {getInitials()}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                    <p className="text-gray-900">{user?.profile_details?.full_name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{user?.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">No. Telepon</p>
                    <p className="text-gray-900">{user?.profile_details?.phone_number || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tanggal Lahir</p>
                    <p className="text-gray-900">{formatDate(user?.profile_details?.birth_date || '')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tempat Lahir</p>
                    <p className="text-gray-900">{user?.profile_details?.birth_place || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kelas</p>
                    <p className="text-gray-900">
                      {user?.class_details ? 
                        `${user.class_details.name} - ${user.class_details.expertise_details?.name}` : 
                        '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Alamat</p>
                <p className="text-gray-900">{user?.profile_details?.address || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pengaturan Akun</h3>
        </div>
        <StudentAccountSettingsPage user={user} />
      </div>
    </div>
  );
};

export default StudentProfilePage;