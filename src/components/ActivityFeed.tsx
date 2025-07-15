import React from 'react';
import { Monitor, Smartphone, Tablet, User, Clock } from 'lucide-react';
import { ActivityLog } from '../types/dashboard';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getRoleColor = (roles: string[]) => {
    const role = roles[0];
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Aktivitas Terbaru
      </h3>
      <div className="flex-1 overflow-hidden">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-3 h-full flex flex-col justify-center">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity._id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.user_data.full_name}
                    </p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getRoleColor(activity.user_data.user_roles)}`}>
                      {activity.user_data.user_roles[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    Login berhasil dari {activity.device_info.os_name}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(activity.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1 hidden sm:flex">
                      {getDeviceIcon(activity.device_info.device_type)}
                      <span>{activity.device_info.browser_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;