import React from 'react';
import { QuestionSet } from '@/types/questionSet';
import { 
  Eye, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  Lock, 
  Globe, 
  FileText,
  Calendar,
  User,
  Hash,
  Award,
  Tag
} from 'lucide-react';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import { getProfileImageUrl } from '@/constants/config';

interface QuestionSetTableProps {
  questionSets: QuestionSet[];
  loading: boolean;
  onViewQuestionSet: (questionSet: QuestionSet) => void;
  onEditQuestionSet: (questionSet: QuestionSet) => void;
  onDeleteQuestionSet: (questionSet: QuestionSet) => void;
}

const QuestionSetTable: React.FC<QuestionSetTableProps> = ({
  questionSets,
  loading,
  onViewQuestionSet,
  onEditQuestionSet,
  onDeleteQuestionSet
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const renderActionButtons = (questionSet: QuestionSet) => {
    return (
      <div className="flex items-center justify-center space-x-2">
        {/* View Button - Always available */}
        <button
          onClick={() => onViewQuestionSet(questionSet)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          title="Lihat Detail"
        >
          <Eye className="w-3 h-3 mr-1" />
          Lihat
        </button>

        {/* Edit Button - Only if user can edit */}
        {questionSet.can_edit && (
          <button
            onClick={() => onEditQuestionSet(questionSet)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
            title="Edit Paket Soal"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </button>
        )}

        {/* Delete Button - Only if user can delete */}
        {questionSet.can_delete && (
          <button
            onClick={() => onDeleteQuestionSet(questionSet)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            title="Hapus Paket Soal"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Hapus
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Memuat paket soal...</p>
            <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  if (questionSets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Paket Soal</h4>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">
            Belum ada paket soal yang sesuai dengan filter yang dipilih. Coba ubah kriteria pencarian Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Daftar Paket Soal</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {questionSets.length} paket soal ditemukan
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Paket Soal</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Mata Pelajaran</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4" />
                  <span>Statistik</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Pembuat</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Status & Tanggal</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questionSets.map((questionSet, index) => (
              <tr key={questionSet._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                {/* Question Set Info */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate" title={questionSet.name}>
                            {questionSet.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {questionSet.is_public ? (
                              <Globe className="w-4 h-4 text-blue-500" title="Public" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400" title="Private" />
                            )}
                            {questionSet.is_creator && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="Anda adalah pembuat" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2" title={questionSet.description}>
                          {questionSet.description || 'Tidak ada deskripsi'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {getGradeLevelLabel(questionSet.grade_level)}
                          </span>
                          {questionSet.metadata.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {questionSet.metadata.tags.slice(0, 2).join(', ')}
                                {questionSet.metadata.tags.length > 2 && '...'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Subject Info */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {questionSet.subject.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Kode: {questionSet.subject.code}
                    </div>
                  </div>
                </td>

                {/* Statistics */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {questionSet.metadata.total_questions} soal
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {questionSet.metadata.total_points} poin
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Mudah: {questionSet.metadata.difficulty_distribution.easy} | 
                      Sedang: {questionSet.metadata.difficulty_distribution.medium} | 
                      Sulit: {questionSet.metadata.difficulty_distribution.hard}
                    </div>
                  </div>
                </td>

                {/* Creator Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {questionSet.created_by.profile_picture_key ? (
                        <img
                          src={getProfileImageUrl(questionSet.created_by.profile_picture_key)}
                          alt={questionSet.created_by.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {questionSet.created_by.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {questionSet.is_creator ? 'Anda' : 'Guru'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status & Date */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(questionSet.status)}`}>
                      {getStatusLabel(questionSet.status)}
                    </span>
                    <div className="text-xs text-gray-500">
                      <div>Dibuat: {formatDateTimeWithTimezone(questionSet.created_at)}</div>
                      {questionSet.updated_at !== questionSet.created_at && (
                        <div>Diubah: {formatDateTimeWithTimezone(questionSet.updated_at)}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-center">
                  {renderActionButtons(questionSet)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionSetTable;