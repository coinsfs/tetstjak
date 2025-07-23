import React from 'react';
import { Monitor, Smartphone, Tablet, User, Clock } from 'lucide-react';
import { ActivityLog } from '@/types/dashboard';

interface ActivityFeedProps {
  activities: ActivityLog[];
  onNewActivity?: (activity: ActivityLog) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-3 h-3" />;
      case 'tablet':
        return <Tablet className="w-3 h-3" />;
      default:
        return <Monitor className="w-3 h-3" />;
    }
  };

  const getRoleColor = (roles: string[]) => {
    const role = roles[0];
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'teacher':
        return 'bg-emerald-500';
      case 'student':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Activity List - Takes all available space */}
      <div className="flex-1 min-h-0">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">No recent activity</p>
              <p className="text-xs text-gray-400">User activities will appear here</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-2">
            {activities.map((activity, index) => (
              <div 
                key={activity._id} 
                className={`flex items-start space-x-2.5 py-1 transition-all duration-500 ease-out ${
                  index === 0 ? 'animate-slide-in-fade' : ''
                }`}
              >
                {/* Avatar - Compact */}
                <div className="flex-shrink-0 relative">
                  <div className={`w-5 h-5 ${getRoleColor(activity.user_data.user_roles)} rounded-full flex items-center justify-center`}>
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                  {index === 0 && activities.length > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white animate-pulse"></div>
                  )}
                </div>

                {/* Content - Compact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate pr-1">
                      {activity.user_data.full_name}
                    </p>
                    <span className="text-xs text-gray-400 flex items-center space-x-0.5 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTime(activity.created_at)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-1.5">
                    Logged in from {activity.device_info.device_type}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      {getDeviceIcon(activity.device_info.device_type)}
                      <span className="truncate">{activity.device_info.browser_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-0.5 flex-shrink-0">
                      <div className={`w-1 h-1 bg-green-400 rounded-full ${index === 0 ? 'animate-pulse' : ''}`}></div>
                      <span className="text-xs text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Compact and always at bottom */}
      {activities.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex-shrink-0">
          <button className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 py-1.5 hover:bg-gray-50 rounded-md transition-colors">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;