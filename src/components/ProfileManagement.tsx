import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, Activity, ChevronRight, Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Profile Management</h1>
              <p className="text-sm text-gray-500">{user?.login_id}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {mainMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveMainMenu(item.id);
                    if (item.subItems.length === 0) {
                      closeSidebar();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                    activeMainMenu === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.subItems.length > 0 && (
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      activeMainMenu === item.id ? 'rotate-90' : ''
                    }`} />
                  )}
                </button>

                {/* Sub-menu */}
                {item.subItems.length > 0 && activeMainMenu === item.id && (
                  <ul className="mt-2 ml-4 space-y-1">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.id}>
                        <button
                          onClick={() => {
                            setActiveSubMenu(subItem.id);
                            closeSidebar();
                          }}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-left text-sm transition-colors ${
                            activeSubMenu === subItem.id
                              ? 'bg-blue-100 text-blue-800'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                        >
                          <span>{subItem.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Kelola informasi dan pengaturan akun Anda
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ProfileManagement;