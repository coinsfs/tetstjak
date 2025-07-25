import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboard';
import { ActivityLog } from '@/types/dashboard';
import { 
  Activity, 
  Monitor, 
  Smartphone, 
  Tablet, 
  User, 
  Clock, 
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserActivity: React.FC = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const fetchActivities = async (showRefreshing = false) => {
    if (!token) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await dashboardService.getActivityLogs(token, 50); // Get more activities for user
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Gagal memuat riwayat aktivitas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [token]);

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

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'success' 
      ? 'bg-green-50 border-green-200' 
      : 'bg-red-50 border-red-200';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
    return formatTime(dateString);
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.status === filter;
  });

  const handleRefresh = () => {
    fetchActivities(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat riwayat aktivitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Riwayat Aktivitas</h3>
              <p className="text-sm text-gray-500">Pantau aktivitas login dan akses akun Anda</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'success' | 'failed')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua</option>
                <option value="success">Berhasil</option>
                <option value="failed">Gagal</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Aktivitas</p>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Login Berhasil</p>
              <p className="text-2xl font-bold text-green-600">
                {activities.filter(a => a.status === 'success').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Login Gagal</p>
              <p className="text-2xl font-bold text-red-600">
                {activities.filter(a => a.status === 'failed').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">
              Aktivitas Terbaru ({filteredActivities.length})
            </h4>
            {filter !== 'all' && (
              <span className="text-sm text-gray-500">
                Filter: {filter === 'success' ? 'Berhasil' : 'Gagal'}
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Tidak ada aktivitas</h4>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'Belum ada riwayat aktivitas untuk ditampilkan'
                  : `Tidak ada aktivitas dengan status "${filter === 'success' ? 'berhasil' : 'gagal'}"`
                }
              </p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div 
                key={activity._id} 
                className={`p-6 hover:bg-gray-50 transition-colors ${getStatusColor(activity.status)}`}
              >
                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(activity.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="text-sm font-medium text-gray-900">
                            {activity.activity === 'login' ? 'Login ke Sistem' : activity.activity}
                          </h5>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            activity.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {activity.status === 'success' ? 'Berhasil' : 'Gagal'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {activity.description}
                        </p>

                        {/* Device and Location Info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            {getDeviceIcon(activity.device_info.device_type)}
                            <span>{activity.device_info.browser_name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Monitor className="w-3 h-3" />
                            <span>{activity.device_info.os_name}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{activity.ip_address}</span>
                          </div>

                          {activity.details && (
                            <div className="flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>{activity.details.method} {activity.details.endpoint}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeTime(activity.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredActivities.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Menampilkan {filteredActivities.length} dari {activities.length} aktivitas
              </span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Data 30 hari terakhir</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivity;