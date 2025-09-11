import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, Activity, ChevronRight } from 'lucide-react';
import ProfileInformation from './profile/ProfileInformation';
import ProfileSettings from './profile/ProfileSettings';
import SecuritySettings from './profile/SecuritySettings';
import UserActivity from './profile/UserActivity';
import GeneralSettings from './profile/GeneralSettings';

type MainMenuItem = 'profile' | 'activity' | 'settings';
type ProfileSubMenuItem = 'information' | 'profile-settings' | 'security';

const ProfileManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeMainMenu, setActiveMainMenu] = useState<MainMenuItem>('profile');
  const [activeSubMenu, setActiveSubMenu] = useState<ProfileSubMenuItem>('information');

  // Reset submenu when main menu changes
  useEffect(() => {
    if (activeMainMenu === 'profile') {
      setActiveSubMenu('information');
    }
  }, [activeMainMenu]);

  const mainMenuItems = [
    {
      id: 'profile' as MainMenuItem,
      label: 'Profile',
      icon: User,
      subItems: [
        { id: 'information' as ProfileSubMenuItem, label: 'Informasi Pribadi' },
        { id: 'profile-settings' as ProfileSubMenuItem, label: 'Pengaturan Profile' },
        { id: 'security' as ProfileSubMenuItem, label: 'Keamanan' }
      ]
    },
    {
      id: 'activity' as MainMenuItem,
      label: 'Aktifitas Pengguna',
      icon: Activity,
      subItems: []
    },
    {
      id: 'settings' as MainMenuItem,
      label: 'Pengaturan',
      icon: Settings,
      subItems: []
    }
  ];

  const renderContent = () => {
    if (activeMainMenu === 'profile') {
      switch (activeSubMenu) {
        case 'information':
          return <ProfileInformation />;
        case 'profile-settings':
          return <ProfileSettings />;
        case 'security':
          return <SecuritySettings />;
        default:
          return <ProfileInformation />;
      }
    } else if (activeMainMenu === 'activity') {
      return <UserActivity />;
    } else if (activeMainMenu === 'settings') {
      return <GeneralSettings />;
    }
    return <ProfileInformation />;
  };

  const getPageTitle = () => {
    if (activeMainMenu === 'profile') {
      const subItem = mainMenuItems[0].subItems.find(item => item.id === activeSubMenu);
      return subItem?.label || 'Profile';
    }
    const mainItem = mainMenuItems.find(item => item.id === activeMainMenu);
    return mainItem?.label || 'Profile';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-gray-600">Kelola informasi dan pengaturan akun Anda</p>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMainMenu(item.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 flex-shrink-0 ${
                  activeMainMenu === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sub-navigation for Profile tab */}
        {activeMainMenu === 'profile' && (
          <div className="mt-4 overflow-x-auto">
            <nav className="flex space-x-4 min-w-max" aria-label="Sub tabs">
              {mainMenuItems[0].subItems.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => setActiveSubMenu(subItem.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    activeSubMenu === subItem.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 whitespace-nowrap flex-shrink-0'
                  }`}
                >
                  {subItem.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProfileManagement;