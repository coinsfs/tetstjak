import React from 'react';
import { UserProfile } from '@/types/auth';
import { BarChart3, TrendingUp, Award, FileText } from 'lucide-react';

interface StudentResultsPageProps {
  user: UserProfile | null;
}

const StudentResultsPage: React.FC<StudentResultsPageProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hasil Ujian</h2>
            <p className="text-gray-600">Lihat hasil dan analisis performa ujian Anda</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Ujian</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Nilai Tertinggi</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Peringkat Kelas</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Performa</h3>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h4>
          <p className="text-gray-500 mb-4">
            Grafik performa akan muncul setelah Anda menyelesaikan ujian.
          </p>
          <p className="text-sm text-gray-400">Coming Soon</p>
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Hasil Terbaru</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Hasil</h4>
            <p className="text-gray-500 mb-4">
              Hasil ujian akan muncul di sini setelah Anda menyelesaikan ujian.
            </p>
            <p className="text-sm text-gray-400">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResultsPage;