import React from 'react';
import { 
  Menu, 
  X,
  Home,
  FileText,
  BarChart3,
  TrendingUp,
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

interface StudentSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPath: string;
  navigate: (path: string) => void;
  logout: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  currentPath,
  navigate,
  logout
}) => {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/student' },
    { id: 'exams', label: 'Ujian', icon: FileText, path: '/student/exams' },
    { id: 'results', label: 'Hasil Ujian', icon: BarChart3, path: '/student/results' },
    { id: 'evaluation', label: 'Evaluasi', icon: TrendingUp, path: '/student/evaluation' },
    { id: 'score-trend', label: 'Tren Nilai Saya', icon: TrendingUp, path: '/student/score-trend-analytics' },
  ];

  const bottomMenuItems: MenuItem[] = [
    { id: 'profile', label: 'Profile', icon: Settings, path: '/student/profile' },
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
    if (path === '/student') {
      return currentPath === '/student';
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
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Student</span>
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
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
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
                        ? 'bg-blue-50 text-blue-700'
                        : item.id === 'logout'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive 
                        ? 'text-blue-600' 
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

export default StudentSidebar;