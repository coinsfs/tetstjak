import React from 'react';
import { Menu } from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { getProfileImageUrl } from '@/constants/config';

interface TeacherHeaderProps {
  user: UserProfile | null;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  user,
  setSidebarOpen,
  title = "Dashboard"
}) => {
  const getProfileImage = () => {
    const profileUrl = user?.profile_details?.profile_picture_key;
    if (profileUrl) {
      const fullUrl = getProfileImageUrl(profileUrl);
      return fullUrl;
    }
    return null;
  };

  const getInitials = () => {
    const fullName = user?.profile_details?.full_name || user?.login_id || 'T';
    return fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 lg:fixed lg:top-0 lg:right-0 lg:left-64">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page Title */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-xl font-semibold text-gray-900 lg:ml-0">
            {title}
          </h1>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.profile_details?.full_name || user?.login_id}
            </p>
            <p className="text-xs text-gray-500">
              {user?.department_details?.name || 'Teacher'}
            </p>
          </div>
          
          <div className="relative">
            {getProfileImage() ? (
              <img
                src={getProfileImage()!}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200 ${getProfileImage() ? 'hidden' : ''}`}>
              <span className="text-sm font-semibold text-green-700">
                {getInitials()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;