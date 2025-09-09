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
    { id: 'analytics', label: 'Analitik', icon: BarChart3, path: '/manage/analytics' },
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
  return (
    <>
      {/* Mobile Overlay - Only show when mobile sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed positioning for desktop, overlay for mobile */}
      <div className={`
        w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full
        ${isOpen 
          ? 'fixed top-0 left-0 z-50 transform translate-x-0 lg:relative lg:z-auto' 
          : 'fixed top-0 left-0 z-50 transform -translate-x-full lg:relative lg:translate-x-0 lg:z-auto'
        }
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        {/* Mobile Close Button - Only show on mobile */}
        <div className="lg:hidden flex justify-end p-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Logo/Header - Fixed */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">School Management</p>
            </div>
          </div>
        </div>

        {/* Main Menu - Scrollable if needed */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide min-h-0">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  onMouseEnter={() => handleMenuHover(item)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors group ${
                    activeMenu === item.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    activeMenu === item.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} />
                  <span className="font-medium transition-colors">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Menu - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <ul className="space-y-2">
            {bottomMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id, item.action)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors group ${
                    activeMenu === item.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : item.id === 'logout'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    activeMenu === item.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : item.id === 'logout' 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} />
                  <span className="font-medium transition-colors">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;