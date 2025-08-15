import React from 'react';
import { QuestionSet } from '@/types/questionSet';
import { 
  X, 
  BookOpen, 
  User, 
  Calendar, 
  Hash, 
  Award, 
  Tag, 
  Globe, 
  Lock, 
  FileText,
  BarChart3
} from 'lucide-react';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import { getProfileImageUrl } from '@/constants/config';

interface QuestionSetDetailModalProps {
  questionSet: QuestionSet;
  isOpen: boolean;
  onClose: () => void;
}

const QuestionSetDetailModal: React.FC<QuestionSetDetailModalProps> = ({
  questionSet,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'published':
        return 'Published';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  const getGradeLevelLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10:
        return 'Kelas X';
      case 11:
        return 'Kelas XI';
      case 12:
        return 'Kelas XII';
      default:
        return `Kelas ${gradeLevel}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detail Paket Soal</h2>
              <p className="text-sm text-gray-600">Informasi lengkap paket soal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-80 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Informasi Dasar
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Paket Soal
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-semibold text-gray-900">{questionSet.name}</p>
                      {questionSet.is_public ? (
                        <Globe className="w-5 h-5 text-blue-500" title="Public" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" title="Private" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <p className="text-gray-900 bg-white p-3 rounded-lg border">
                      {questionSet.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tingkat Kelas
                      </label>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {getGradeLevelLabel(questionSet.grade_level)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(questionSet.status)}`}>
                        {getStatusLabel(questionSet.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mata Pelajaran
                    </label>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="font-medium text-gray-900">{questionSet.subject.name}</div>
                      <div className="text-sm text-gray-500">Kode: {questionSet.subject.code}</div>
                      {questionSet.subject.description && (
                        <div className="text-sm text-gray-600 mt-1">{questionSet.subject.description}</div>
                      )}
                    </div>
                  </div>

                  {questionSet.metadata.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {questionSet.metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  Statistik Soal
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Total Soal</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {questionSet.metadata.total_questions}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Total Poin</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {questionSet.metadata.total_points}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribusi Tingkat Kesulitan
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-green-600">
                        {questionSet.metadata.difficulty_distribution.easy}
                      </div>
                      <div className="text-xs text-gray-500">Mudah</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {questionSet.metadata.difficulty_distribution.medium}
                      </div>
                      <div className="text-xs text-gray-500">Sedang</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-red-600">
                        {questionSet.metadata.difficulty_distribution.hard}
                      </div>
                      <div className="text-xs text-gray-500">Sulit</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              {/* Creator Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Pembuat
                </h3>
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    {questionSet.created_by.profile_picture_key ? (
                      <img
                        src={getProfileImageUrl(questionSet.created_by.profile_picture_key)}
                        alt={questionSet.created_by.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {questionSet.created_by.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {questionSet.is_creator ? 'Anda adalah pembuat' : 'Guru'}
                    </div>
                  </div>
                </div>

                {questionSet.is_creator && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">
                        Anda adalah pembuat paket soal ini
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Waktu
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Dibuat
                    </label>
                    <div className="text-sm text-gray-900">
                      {formatDateTimeWithTimezone(questionSet.created_at)}
                    </div>
                  </div>

                  {questionSet.updated_at !== questionSet.created_at && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Terakhir Diubah
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatDateTimeWithTimezone(questionSet.updated_at)}
                      </div>
                    </div>
                  )}

                  {questionSet.published_date && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Dipublikasi
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatDateTimeWithTimezone(questionSet.published_date)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hak Akses Anda
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dapat melihat</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dapat mengedit</span>
                    <div className={`w-2 h-2 rounded-full ${questionSet.can_edit ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dapat kelola soal</span>
                    <div className={`w-2 h-2 rounded-full ${questionSet.can_manage_questions ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dapat menghapus</span>
                    <div className={`w-2 h-2 rounded-full ${questionSet.can_delete ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dapat duplikasi</span>
                    <div className={`w-2 h-2 rounded-full ${questionSet.can_duplicate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetDetailModal;