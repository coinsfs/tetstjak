import React from 'react';
import { UserProfile } from '@/types/auth';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentExamsPage from './pages/StudentExamsPage';
import StudentResultsPage from './pages/StudentResultsPage';
import StudentEvaluationPage from './pages/StudentEvaluationPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentExamTakingPage from './pages/StudentExamTakingPage';

interface StudentMainContentProps {
  user: UserProfile | null;
  currentPath: string;
}

const StudentMainContent: React.FC<StudentMainContentProps> = ({
  user,
  currentPath
}) => {
  const renderContent = () => {
    // Handle exam taking route with session ID
    if (currentPath.startsWith('/student/exam-taking/')) {
      const sessionId = currentPath.split('/').pop();
      if (sessionId) {
        return <StudentExamTakingPage user={user} sessionId={sessionId} />;
      }
    }
    
    switch (currentPath) {
      case '/student':
        return <StudentDashboardPage user={user} />;
      case '/student/exams':
        return <StudentExamsPage user={user} />;
      case '/student/results':
        return <StudentResultsPage user={user} />;
      case '/student/evaluation':
        return <StudentEvaluationPage user={user} />;
      case '/student/profile':
        return <StudentProfilePage user={user} />;
      default:
        return <StudentDashboardPage user={user} />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 lg:pt-16">
      <div className="page-container py-6">
        {renderContent()}
      </div>
    </main>
  );
};

export default StudentMainContent;