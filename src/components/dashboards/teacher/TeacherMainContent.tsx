import React from 'react';
import { UserProfile } from '@/types/auth';
import { TeacherDashboardStats } from '@/types/dashboard';
import TeacherStatsGrid from './TeacherStatsGrid';
import TeacherDepartmentInfo from './TeacherDepartmentInfo';
import TeacherSubjectsList from './TeacherSubjectsList';
import TeacherWelcomeCard from './TeacherWelcomeCard';
import TeacherClassesPage from './pages/TeacherClassesPage';
import TeacherExamsPage from './pages/TeacherExamsPage';
import TeacherQuestionsPage from './pages/TeacherQuestionsPage';
import TeacherAnalyticsPage from './pages/TeacherAnalyticsPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import TeacherQuestionSetsPage from './pages/TeacherQuestionSetsPage';

interface TeacherMainContentProps {
  user: UserProfile | null;
  currentPath: string;
  dashboardStats?: TeacherDashboardStats;
  statsLoading?: boolean;
}

const TeacherMainContent: React.FC<TeacherMainContentProps> = ({
  user,
  currentPath,
  dashboardStats,
  statsLoading = false
}) => {
  const renderContent = () => {
    switch (currentPath) {
      case '/teacher':
        return (
          <div className="space-y-6">
            <TeacherStatsGrid stats={dashboardStats} loading={statsLoading} />
            <TeacherSubjectsList user={user} />
            <TeacherWelcomeCard user={user} />
          </div>
        );
      case '/teacher/classes':
        return <TeacherClassesPage />;
      case '/teacher/exams':
        return <TeacherExamsPage />;
      case '/teacher/questions':
        return <TeacherQuestionsPage />;
      case '/teacher/question-sets':
        return <TeacherQuestionSetsPage />;
      case '/teacher/analytics':
        return <TeacherAnalyticsPage />;
      case '/teacher/profile':
        return <TeacherProfilePage />;
      default:
        // Handle sub-routes or fallback to dashboard
        if (currentPath.startsWith('/teacher/')) {
          // For any teacher sub-route that's not explicitly handled, show appropriate content
          // You can add more specific handling here if needed
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Halaman Tidak Ditemukan</h2>
                <p className="text-gray-600">
                  Halaman yang Anda cari tidak tersedia. Silakan gunakan menu navigasi untuk mengakses fitur yang tersedia.
                </p>
              </div>
            </div>
          );
        }
        
        // Default to dashboard content
        return (
          <div className="space-y-6">
            <TeacherStatsGrid stats={dashboardStats} loading={statsLoading} />
            <TeacherDepartmentInfo user={user} />
            <TeacherSubjectsList user={user} />
            <TeacherWelcomeCard user={user} />
          </div>
        );
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:pt-20 overflow-hidden">
      {renderContent()}
    </main>
  );
};

export default TeacherMainContent;