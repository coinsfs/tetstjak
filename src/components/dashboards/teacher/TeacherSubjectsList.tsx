import React from 'react';
import { BookOpen } from 'lucide-react';
import { UserProfile } from '@/types/auth';
import TeacherInfoCard from './TeacherInfoCard';

interface TeacherSubjectsListProps {
  user: UserProfile | null;
}

const TeacherSubjectsList: React.FC<TeacherSubjectsListProps> = ({ user }) => {
  if (!user?.teaching_summary || user.teaching_summary.length === 0) return null;

  return (
    <TeacherInfoCard user={user} title="Mata Pelajaran yang Diampu">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {user.teaching_summary.map((teaching, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{teaching.subject_name}</p>
                <p className="text-sm text-gray-600">{teaching.class_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TeacherInfoCard>
  );
};

export default TeacherSubjectsList;