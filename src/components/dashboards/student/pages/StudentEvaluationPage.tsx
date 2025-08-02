import React from 'react';
import { UserProfile } from '@/types/auth';
import { TrendingUp, Target, BookOpen, CheckCircle } from 'lucide-react';

interface StudentEvaluationPageProps {
  user: UserProfile | null;
}

const StudentEvaluationPage: React.FC<StudentEvaluationPageProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Evaluasi</h2>
            <p className="text-gray-600">Analisis mendalam tentang performa dan progress belajar Anda</p>
          </div>
        </div>
      </div>

      {/* Evaluation Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Kemampuan</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">-</p>
            <p className="text-gray-500">Belum tersedia</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">0%</p>
            <p className="text-gray-500">Kemajuan belajar</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Materi</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-gray-500">Materi dikuasai</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pencapaian</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-gray-500">Target tercapai</p>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa per Mata Pelajaran</h3>
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Evaluasi Mata Pelajaran</h4>
          <p className="text-gray-500 mb-4">
            Analisis performa per mata pelajaran akan muncul setelah Anda menyelesaikan beberapa ujian.
          </p>
          <p className="text-sm text-gray-400">Coming Soon</p>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekomendasi Belajar</h3>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Rekomendasi akan muncul berdasarkan performa Anda</p>
            <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Perbaikan</h3>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Area yang perlu diperbaiki akan diidentifikasi</p>
            <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEvaluationPage;