import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { scoreTrendAnalyticsService } from '@/services/scoreTrendAnalytics';
import { ScoreTrendResponse, ScoreTrendFilters } from '@/types/scoreTrendAnalytics';
import ScoreTrendChart from '@/components/charts/ScoreTrendChart';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScoreTrendAnalyticsProps {
  title?: string;
  defaultFilters?: ScoreTrendFilters;
  showFilters?: boolean;
  height?: number;
}

const ScoreTrendAnalytics: React.FC<ScoreTrendAnalyticsProps> = ({ 
  title = 'Analitik Tren Nilai', 
  defaultFilters = {},
  showFilters = true,
  height 
}) => {
  const { token, user } = useAuth();
  const [data, setData] = useState<ScoreTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScoreTrendFilters>(defaultFilters);

  const fetchData = async () => {
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

  useEffect(() => {
    fetchData();
  }, [token, filters]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleFilterChange = (newFilters: ScoreTrendFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal Memuat Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">Filter:</span>
              {Object.entries(filters).map(([key, value]) => (
                <span 
                  key={key} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2"
                >
                  {key}: {String(value)}
                </span>
              ))}
              {Object.keys(filters).length === 0 && (
                <span className="text-gray-500 italic">Tidak ada filter aktif</span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Chart */}
      <div className="p-2">
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              Data diperbarui: {new Date(data.metadata.generated_at).toLocaleString('id-ID')}
            </div>
            <div>
              Grup berdasarkan: {data.metadata.group_by}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreTrendAnalytics;