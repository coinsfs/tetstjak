import React from 'react';
import { UserProfile } from '@/types/auth';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';

interface StudentAccountSettingsPageProps {
  user: UserProfile | null;
}

const StudentAccountSettingsPage: React.FC<StudentAccountSettingsPageProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <ChangePasswordForm />
    </div>
  );
};

export default StudentAccountSettingsPage;