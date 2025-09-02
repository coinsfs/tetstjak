import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { useRouter } from '@/hooks/useRouter';
import TeacherInfoCard from './TeacherInfoCard';

interface TeacherSubjectsListProps {
  user: UserProfile | null;
}

const TeacherSubjectsList: React.FC<TeacherSubjectsListProps> = ({ user }) => {
  const { navigate } = useRouter();
  const DISPLAY_LIMIT = 3; // Limit tampilan awal mata pelajaran

  if (!user?.teaching_summary || user.teaching_summary.length === 0) return null;

  const displayedSubjects = user.teaching_summary.slice(0, DISPLAY_LIMIT);
  const hasMoreSubjects = user.teaching_summary.length > DISPLAY_LIMIT;
  const remainingCount = user.teaching_summary.length - DISPLAY_LIMIT;

  return (
    <TeacherInfoCard user={user} title="Mata Pelajaran yang Diampu">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedSubjects.map((teaching, index) => (
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
        
        {hasMoreSubjects && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => navigate('/teacher/classes')}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors group"
            >
              <span className="text-sm font-medium">
                Lihat Selengkapnya ({remainingCount} lainnya)
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </TeacherInfoCard>
  );
};

export default TeacherSubjectsList;