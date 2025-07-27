import React from 'react';
import { UserProfile } from '@/types/auth';
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
}

const TeacherMainContent: React.FC<TeacherMainContentProps> = ({
  user,
  currentPath
}) => {
  const renderContent = () => {
    switch (currentPath) {
      case '/teacher':
        return (
          <>
            <TeacherStatsGrid />
            <TeacherDepartmentInfo user={user} />
            <TeacherSubjectsList user={user} />
            <TeacherWelcomeCard user={user} />
          </>
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
          <>
            <TeacherStatsGrid />
            <TeacherDepartmentInfo user={user} />
            <TeacherSubjectsList user={user} />
            <TeacherWelcomeCard user={user} />
          </>
        );
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 overflow-y-auto lg:pt-20">
      {renderContent()}
    </main>
  );
};

export default TeacherMainContent;