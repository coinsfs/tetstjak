import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subjectMasteryAnalyticsService } from '@/services/subjectMasteryAnalytics';
import { SubjectMasteryResponse, SubjectMasteryFilters } from '@/types/subjectMastery';
import SubjectMasteryRadarChart from '@/components/charts/SubjectMasteryRadarChart';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubjectMasteryAnalyticsProps {
  defaultFilters?: SubjectMasteryFilters;
  height?: number;
  title?: string;
}

export interface SubjectMasteryAnalyticsRef {
  refreshData: () => void;
}

const SubjectMasteryAnalytics = forwardRef<SubjectMasteryAnalyticsRef, SubjectMasteryAnalyticsProps>(({ 
  defaultFilters = {},
  height,
  title
}, ref) => {
  const { token, user } = useAuth();
  const [data, setData] = useState<SubjectMasteryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SubjectMasteryFilters>(defaultFilters);

  const refreshData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use POST for complex filters, GET for simple ones
      let result: SubjectMasteryResponse;
      if (Object.keys(filters).length > 3) {
        result = await subjectMasteryAnalyticsService.postSubjectMasteryAnalytics(token, filters);
      } else {
        result = await subjectMasteryAnalyticsService.getSubjectMasteryAnalytics(token, filters);
      }
      
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data analitik penguasaan mata pelajaran';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching subject mastery analytics:', err);
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
            <span className="text-gray-600">Memuat data penguasaan mata pelajaran...</span>
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
      {/* Title */}
      {title && (
        <div className="px-3 py-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      )}
      
      {/* Chart */}
      <div className="p-3">
        {data ? (
          <SubjectMasteryRadarChart 
            data={data} 
            height={height}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Tidak ada data penguasaan mata pelajaran</div>
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
              {'metadata' in data 
                ? `Data diperbarui: ${new Date(data.metadata.generated_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
                : `Total entitas: ${'entities' in data ? data.entities.length : 0}`
              }
            </div>
            <div>
              {'metadata' in data 
                ? `${data.metadata.total_subjects} mata pelajaran`
                : `Rata-rata sekolah: ${'comparison_metadata' in data ? data.comparison_metadata.school_average.toFixed(1) : 0}`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SubjectMasteryAnalytics.displayName = 'SubjectMasteryAnalytics';

export default SubjectMasteryAnalytics;