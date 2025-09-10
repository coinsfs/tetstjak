import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { scoreTrendAnalyticsService } from '@/services/scoreTrendAnalytics';
import { ScoreTrendResponse, ScoreTrendFilters } from '@/types/scoreTrendAnalytics';
import ScoreTrendChart from '@/components/charts/ScoreTrendChart';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScoreTrendAnalyticsProps {
  defaultFilters?: ScoreTrendFilters;
  height?: number;
  visibleFilterIds?: string[];
}

export interface ScoreTrendAnalyticsRef {
  refreshData: () => void;
}

const ScoreTrendAnalytics = forwardRef<ScoreTrendAnalyticsRef, ScoreTrendAnalyticsProps>(({ 
  defaultFilters = {},
  height,
  visibleFilterIds
}, ref) => {
  const { token, user } = useAuth();
  const [data, setData] = useState<ScoreTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScoreTrendFilters>(defaultFilters);

  const refreshData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use POST for complex filters, GET for simple ones
      let result: ScoreTrendResponse;
      if (Object.keys(filters).length > 3) {
        result = await scoreTrendAnalyticsService.postScoreTrendAnalytics(token, filters);
      } else {
        result = await scoreTrendAnalyticsService.getScoreTrendAnalytics(token, filters);
      }
      
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data analitik';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching score trend analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Expose refreshData function to parent component
  useImperativeHandle(ref, () => ({
    refreshData
  }));

  useEffect(() => {
    refreshData();
  }, [token]);

  // Separate effect for filters to avoid infinite loops
  useEffect(() => {
    if (token) {
      refreshData();
    }
  }, [filters]);

  const handleFilterChange = (newFilters: ScoreTrendFilters) => {
    setFilters(newFilters);
  };

  // Update filters when defaultFilters change
  useEffect(() => {
    setFilters(defaultFilters);
  }, [JSON.stringify(defaultFilters)]);
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
            <span className="text-gray-600">Memuat data analitik...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal Memuat Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Chart */}
      <div className="p-3">
        {data ? (
          <ScoreTrendChart 
            data={data.series} 
            title="" 
            height={height}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Tidak ada data analitik</div>
              <p className="text-sm text-gray-500">Data akan muncul setelah ujian dilakukan</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {data && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs sm:text-sm text-gray-500">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              Data diperbarui: {new Date(data.metadata.generated_at).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta'
              })} WIB
            </div>
            <div>
              Grup: {data.metadata.group_by === 'class' ? 'Kelas' : 
                     data.metadata.group_by === 'subject' ? 'Mata Pelajaran' :
                     data.metadata.group_by === 'grade' ? 'Jenjang' :
                     data.metadata.group_by === 'teacher' ? 'Guru' : 
                     data.metadata.group_by}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ScoreTrendAnalytics.displayName = 'ScoreTrendAnalytics';

export default ScoreTrendAnalytics;