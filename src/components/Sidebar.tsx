import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  Settings,
  BarChart3,
  Download,
  User,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (menu: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuClick, isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin'
    },
    {
      id: 'teachers',
      label: 'Teacher Management',
      icon: GraduationCap,
      path: '/manage/teachers'
    },
    {
      id: 'students',
      label: 'Student Management',
      icon: Users,
      path: '/manage/students'
    },
    {
      id: 'expertise-programs',
      label: 'Expertise Programs',
      icon: BookOpen,
      path: '/manage/expertise-programs'
    },
    {
      id: 'exams',
      label: 'Exam Management',
      icon: ClipboardList,
      path: '/manage/exams'
    },
    {
      id: 'subjects',
      label: 'Subject Management',
      icon: BookOpen,
      path: '/manage/subjects'
    },
    {
      id: 'classes',
      label: 'Class Management',
      icon: Calendar,
      path: '/manage/classes'
    },
    {
      id: 'assignments',
      label: 'Assignment Management',
      icon: ClipboardList,
      path: '/manage/assignments'
    },
    {
      id: 'exports',
      label: 'Data Export',
      icon: Download,
      path: '/manage/exports'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/manage/analytics'
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: User,
      path: '/profile'
    }
  ];

  const handleMenuClick = (menuId: string) => {
    onMenuClick(menuId);
    onClose(); // Close sidebar on mobile after menu click
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        sidebar-container
      `}>
        {/* Header */}
        <div className="sidebar-header px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SSH</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Smart Study Hub</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg mx-2 transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer px-4 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.profile_details?.full_name || user?.login_id}
              </p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;