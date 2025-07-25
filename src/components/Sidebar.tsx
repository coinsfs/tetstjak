import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  FileText, 
  BookOpen, 
  School, 
  BarChart3, 
  ClipboardList,
  User, 
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (menu: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuClick, isOpen, onClose }) => {
  const { logout, token } = useAuth();
  const { prefetchTeachers, prefetchStudents, prefetchExams, prefetchSubjects, prefetchClasses, prefetchExpertisePrograms } = usePrefetch(token);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teachers', label: 'Kelola Guru', icon: Users, path: '/manage/teachers', prefetch: prefetchTeachers },
    { id: 'students', label: 'Kelola Siswa', icon: GraduationCap, path: '/manage/students', prefetch: prefetchStudents },
    { id: 'expertise-programs', label: 'Kelola Jurusan', icon: School, path: '/manage/expertise-programs', prefetch: prefetchExpertisePrograms },
    { id: 'exams', label: 'Kelola Ujian', icon: FileText, path: '/manage/exams', prefetch: prefetchExams },
    { id: 'subjects', label: 'Mata Pelajaran', icon: BookOpen, path: '/manage/subjects', prefetch: prefetchSubjects },
    { id: 'classes', label: 'Kelas', icon: School, path: '/manage/classes', prefetch: prefetchClasses },
    { id: 'assignments', label: 'Penugasan', icon: ClipboardList, path: '/manage/assignments' },
    { id: 'analytics', label: 'Analitik', icon: BarChart3 },
  ];

  const bottomMenuItems = [
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, action: logout },
  ];

  const handleMenuClick = (menu: string, action?: () => void) => {
    if (action) {
      action();
    } else {
      onMenuClick(menu);
    }
    onClose(); // Close mobile menu after selection
  };

  const handleMenuHover = (item: any) => {
    if (item.prefetch && activeMenu !== item.id) {
      // Add small delay to avoid unnecessary requests on quick hovers
      const timeoutId = setTimeout(() => {
        item.prefetch();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Enhanced sidebar with fixed positioning structure
  return (
    <div className={`main-sidebar-fixed ${isOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Close Button - Only show on mobile */}
      <div className="lg:hidden flex justify-end p-4 sidebar-header-fixed">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Logo/Header - Fixed */}
      <div className="p-6 sidebar-header-fixed">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">School Management</p>
          </div>
        </div>
      </div>

      {/* Main Menu - Scrollable content area */}
      <nav className="sidebar-nav-scrollable px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                onMouseEnter={() => handleMenuHover(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeMenu === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Menu - Fixed at bottom */}
      <div className="px-4 py-4 sidebar-footer-fixed">
        <ul className="space-y-2">
          {bottomMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id, item.action)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeMenu === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${item.id === 'logout' ? 'hover:bg-red-50 hover:text-red-700' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;