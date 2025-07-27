import React from 'react';
import { BarChart3 } from 'lucide-react';

const TeacherAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analitik Pembelajaran
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4">
            Fitur analitik pembelajaran sedang dalam pengembangan.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalyticsPage;