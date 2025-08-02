import React from 'react';
import { UserProfile } from '@/types/auth';
import { FileText, Clock, AlertCircle } from 'lucide-react';

interface StudentExamsPageProps {
  user: UserProfile | null;
}

const StudentExamsPage: React.FC<StudentExamsPageProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ujian</h2>
            <p className="text-gray-600">Kelola dan ikuti ujian yang tersedia</p>
          </div>
        </div>
      </div>

      {/* Exam Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ujian Tersedia</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-gray-500">Ujian siap dikerjakan</p>
          </div>
        </div>

        {/* Ongoing Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sedang Berlangsung</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-gray-500">Ujian aktif</p>
          </div>
        </div>

        {/* Completed Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selesai</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">0</p>
            <p className="text-gray-500">Ujian telah selesai</p>
          </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Daftar Ujian</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Ujian</h4>
            <p className="text-gray-500 mb-4">
              Saat ini belum ada ujian yang tersedia untuk Anda.
            </p>
            <p className="text-sm text-gray-400">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentExamsPage;