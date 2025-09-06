import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';

const TeacherAnalyticsPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analitik Pembelajaran
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Pilih jenis analitik yang ingin Anda lihat:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/teacher/score-trend-analytics')}
              className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Tren Nilai Ujian</h4>
              <p className="text-sm text-gray-600 text-center">
                Lihat tren perkembangan nilai ujian siswa dari waktu ke waktu
              </p>
            </button>
            
            <div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg opacity-50">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Analitik Lainnya</h4>
              <p className="text-sm text-gray-600 text-center">
                Fitur analitik tambahan sedang dalam pengembangan
              </p>
              <div className="mt-3 inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalyticsPage;