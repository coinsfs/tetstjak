import React from 'react';
import { UserProfile } from '@/types/auth';

interface StudentExamTakingPageProps {
  user: UserProfile | null;
  sessionId: string;
}

const StudentExamTakingPage: React.FC<StudentExamTakingPageProps> = ({ user, sessionId }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Hello World</h1>
        <p className="text-lg text-gray-600 mb-2">Session ID: {sessionId}</p>
        <p className="text-sm text-gray-500">User: {user?.profile_details?.full_name || 'Unknown'}</p>
      </div>
    </div>
  );
};

export default StudentExamTakingPage;