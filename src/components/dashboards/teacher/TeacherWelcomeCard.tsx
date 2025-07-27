import React from 'react';
import { BookOpen } from 'lucide-react';
import { UserProfile } from '@/types/auth';
import TeacherInfoCard from './TeacherInfoCard';

interface TeacherWelcomeCardProps {
  user: UserProfile | null;
}

const TeacherWelcomeCard: React.FC<TeacherWelcomeCardProps> = ({ user }) => {
  return (
    <TeacherInfoCard user={user} title="Aktivitas Mengajar">
      <div className="text-center py-8 sm:py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selamat datang, {user?.profile_details?.full_name || user?.login_id}!
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Kelola kelas dan siswa Anda dengan mudah. Gunakan menu di sidebar untuk mengakses berbagai fitur yang tersedia.
        </p>
      </div>
    </TeacherInfoCard>
  );
};

export default TeacherWelcomeCard;