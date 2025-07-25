import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, Activity, ChevronRight, Menu, X, ArrowLeft } from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';
import Sidebar from './Sidebar';
import ProfileInformation from './profile/ProfileInformation';
import ProfileSettings from './profile/ProfileSettings';
import SecuritySettings from './profile/SecuritySettings';
import UserActivity from './profile/UserActivity';
import GeneralSettings from './profile/GeneralSettings';

type MainMenuItem = 'profile' | 'activity' | 'settings';
type ProfileSubMenuItem = 'information' | 'profile-settings' | 'security';

const ProfileManagement: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [activeMainMenu, setActiveMainMenu] = useState<MainMenuItem>('profile');
  const [activeSubMenu, setActiveSubMenu] = useState<ProfileSubMenuItem>('information');
  const [mainSidebarOpen, setMainSidebarOpen] = useState(false);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);

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

  const handleMainSidebarMenuClick = (menu: string) => {
    // Handle main sidebar navigation
    const pathMap: { [key: string]: string } = {
      'dashboard': '/admin',
      'teachers': '/manage/teachers',
      'students': '/manage/students',
      'expertise-programs': '/manage/expertise-programs',
      'exams': '/manage/exams',
      'subjects': '/manage/subjects',
      'classes': '/manage/classes',
      'assignments': '/manage/assignments',
      'analytics': '/manage/analytics',
      'profile': '/profile',
    };
    
    const path = pathMap[menu];
    if (path && path !== '/profile') {
      navigate(path);
    }
    
    setMainSidebarOpen(false);
  };

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

  const closeMainSidebar = () => {
    setMainSidebarOpen(false);
  };

  const closeProfileSidebar = () => {
    setProfileSidebarOpen(false);
  };

  const handleBackToDashboard = () => {
    navigate('/admin');
  };

  // Add body class for mobile sidebar state management
  React.useEffect(() => {
    if (mainSidebarOpen || profileSidebarOpen) {
      document.body.classList.add('sidebar-mobile-open');
    } else {
      document.body.classList.remove('sidebar-mobile-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-mobile-open');
    };
  }, [mainSidebarOpen, profileSidebarOpen]);

  return (
    <div className="fixed-layout-container">
      {/* Mobile Overlays */}
      <div className={`sidebar-overlay ${mainSidebarOpen || profileSidebarOpen ? 'active' : ''} lg:hidden`} 
           onClick={() => {
             closeMainSidebar();
             closeProfileSidebar();
           }} />

      {/* Main Application Sidebar - Always Fixed */}
      <Sidebar 
        activeMenu="profile" 
        onMenuClick={handleMainSidebarMenuClick}
        isOpen={mainSidebarOpen}
        onClose={closeMainSidebar}
      />

      {/* Profile Sidebar - Fixed on Desktop */}
      <div className={`profile-sidebar-fixed hidden lg:flex lg:flex-col ${profileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Profile Sidebar Header - Fixed */}
        <div className="p-6 sidebar-header-fixed">
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

        {/* Profile Navigation - Scrollable content area */}
        <nav className="sidebar-nav-scrollable px-4 py-6">
          <ul className="space-y-2">
            {mainMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveMainMenu(item.id);
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
                          onClick={() => setActiveSubMenu(subItem.id)}
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

      {/* Profile Sidebar - Mobile Version */}
      {profileSidebarOpen && (
        <div className="profile-sidebar-fixed mobile-open lg:hidden">
          {/* Mobile Close Button - Fixed */}
          <div className="flex justify-end p-4 sidebar-header-fixed">
            <button
              onClick={closeProfileSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Profile Sidebar Header - Fixed */}
          <div className="p-6 sidebar-header-fixed">
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

          {/* Profile Navigation - Scrollable */}
          <nav className="sidebar-nav-scrollable px-4 py-6">
            <ul className="space-y-2">
              {mainMenuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveMainMenu(item.id);
                      if (item.subItems.length === 0) {
                        closeProfileSidebar();
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
                              closeProfileSidebar();
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
      )}

      {/* Main Content Area - Scrollable with fixed header */}
      <div className="content-with-fixed-sidebars flex flex-col">
        {/* Header - Sticky at top of content area */}
        <header className="profile-header-fixed px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMainSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                title="Open main menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {/* Profile Menu Button (Mobile) */}
              <button
                onClick={() => setProfileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                title="Open profile menu"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Back to Dashboard Button */}
              <button
                onClick={handleBackToDashboard}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Kembali ke Dashboard</span>
                <span className="sm:hidden">Kembali</span>
              </button>
              
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Kelola informasi dan pengaturan akun Anda
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="profile-main-content">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileManagement;