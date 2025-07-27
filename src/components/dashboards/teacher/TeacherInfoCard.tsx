import React from 'react';
import { UserProfile } from '@/types/auth';

interface TeacherInfoCardProps {
  user: UserProfile | null;
  title: string;
  children: React.ReactNode;
}

const TeacherInfoCard: React.FC<TeacherInfoCardProps> = ({
  user,
  title,
  children
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default TeacherInfoCard;