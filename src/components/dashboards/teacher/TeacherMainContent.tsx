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
            <TeacherDepartmentInfo user={user} />
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
      case '/teacher/analytics':
        return <TeacherAnalyticsPage />;
      case '/teacher/profile':
        return <TeacherProfilePage />;
      default:
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