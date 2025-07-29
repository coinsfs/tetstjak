import React from 'react';
import { 
  Menu, 
  X,
  Home,
  Users,
  FileText,
  HelpCircle,
  BarChart3,
  Settings,
  LogOut,
  BookOpen
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  action?: () => void;
}

interface TeacherSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPath: string;
  navigate: (path: string) => void;
  logout: () => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  currentPath,
  navigate,
  logout
}) => {
  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', icon: Home, path: '/teacher' },
    { id: 'classes', label: 'Kelas', icon: Users, path: '/teacher/classes' },
    { id: 'exams', label: 'Ujian', icon: FileText, path: '/teacher/exams' },
    { id: 'questions', label: 'Bank Soal', icon: HelpCircle, path: '/teacher/questions' },
    { id: 'analytics', label: 'Analitik', icon: BarChart3, path: '/teacher/analytics' },
  ];

  const bottomMenuItems: MenuItem[] = [
    { id: 'profile', label: 'Profile', icon: Settings, path: '/teacher/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, path: '', action: logout },
  ];

  const handleMenuClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    setSidebarOpen(false);
  };

  const isActiveMenu = (path: string) => {
    if (path === '/teacher') {
      return currentPath === '/teacher';
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="sidebar-container">
          {/* Sidebar Header */}
          <div className="sidebar-header flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Teacher</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveMenu(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Menu Items */}
          <div className="sidebar-footer">
            <div className="space-y-2">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path ? isActiveMenu(item.path) : false;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : item.id === 'logout'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive 
                        ? 'text-green-600' 
                        : item.id === 'logout' 
                        ? 'text-red-500' 
                        : 'text-gray-400'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherSidebar;