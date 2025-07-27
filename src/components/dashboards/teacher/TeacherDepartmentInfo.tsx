import React from 'react';
import { UserProfile } from '@/types/auth';
import TeacherInfoCard from './TeacherInfoCard';

interface TeacherDepartmentInfoProps {
  user: UserProfile | null;
}

const TeacherDepartmentInfo: React.FC<TeacherDepartmentInfoProps> = ({ user }) => {
  if (!user?.department_details) return null;

  return (
    <TeacherInfoCard user={user} title="Informasi Jurusan">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Jurusan</p>
          <p className="text-lg font-medium text-gray-900">{user.department_details.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Singkatan</p>
          <p className="text-lg font-medium text-gray-900">{user.department_details.abbreviation}</p>
        </div>
      </div>
    </TeacherInfoCard>
  );
};

export default TeacherDepartmentInfo;