import React from 'react';
import { Settings } from 'lucide-react';

const TeacherProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pengaturan Profile
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4">
            Fitur pengaturan profile sedang dalam pengembangan.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;