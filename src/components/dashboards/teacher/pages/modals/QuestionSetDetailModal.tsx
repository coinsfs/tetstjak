import React, { useState, useEffect } from 'react';
import { X, Package, BookOpen, Users, Calendar, Tag, Globe, Lock, Edit, Settings, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService, QuestionSet } from '@/services/questionSet';
import { getProfileImageUrl } from '@/constants/config';
import toast from 'react-hot-toast';

interface QuestionSetDetailModalProps {
  questionSet: QuestionSet;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onManageQuestions: () => void;
  onDelete: () => void;
}

const QuestionSetDetailModal: React.FC<QuestionSetDetailModalProps> = ({
  questionSet: initialQuestionSet,
  isOpen,
  onClose,
  onEdit,
  onManageQuestions,
  onDelete
}) => {
  const { token } = useAuth();
  const [questionSet, setQuestionSet] = useState<QuestionSet>(initialQuestionSet);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetailedQuestionSet = async () => {
      if (!token || !isOpen) return;

      setLoading(true);
      try {
        const detailedQuestionSet = await questionSetService.getQuestionSetDetails(token, initialQuestionSet._id);
        setQuestionSet(detailedQuestionSet);
      } catch (error) {
        console.error('Error fetching question set details:', error);
        toast.error('Gagal memuat detail paket soal');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetailedQuestionSet();
    }
  }, [isOpen, token, initialQuestionSet._id]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', label: 'Draft' };
      case 'published':
        return { color: 'bg-green-100 text-green-800', label: 'Published' };
      case 'archived':
        return { color: 'bg-red-100 text-red-800', label: 'Archived' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusInfo = getStatusBadge(questionSet.status);
  const profileImageUrl = questionSet.created_by.profile_picture_key 
    ? getProfileImageUrl(questionSet.created_by.profile_picture_key)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Paket Soal</h2>
              <p className="text-sm text-gray-500">Informasi lengkap paket soal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-gray-600">Memuat detail...</span>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Informasi Paket Soal
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nama Paket Soal</p>
                    <p className="font-medium text-gray-900">{questionSet.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Deskripsi</p>
                    <p className="text-gray-900">{questionSet.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Visibilitas</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {questionSet.is_public ? (
                          <>
                            <Globe className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700">Publik</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">Pribadi</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Mata Pelajaran</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-gray-900">
                          {questionSet.subject.name} ({questionSet.subject.code})
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Tingkat Kelas</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-gray-900">
                          Kelas {getGradeLabel(questionSet.grade_level)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Versi</p>
                    <p className="font-medium text-gray-900">v{questionSet.version || 1}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Statistik Soal
                </h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Soal</p>
                      <p className="text-2xl font-bold text-gray-900">{questionSet.metadata.total_questions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Poin</p>
                      <p className="text-2xl font-bold text-gray-900">{questionSet.metadata.total_points}</p>
                    </div>
                  </div>

                  {questionSet.metadata.total_questions > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Distribusi Kesulitan</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Mudah</span>
                          <span className="text-sm font-medium text-green-600">
                            {questionSet.metadata.difficulty_distribution.easy}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Sedang</span>
                          <span className="text-sm font-medium text-yellow-600">
                            {questionSet.metadata.difficulty_distribution.medium}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Sulit</span>
                          <span className="text-sm font-medium text-red-600">
                            {questionSet.metadata.difficulty_distribution.hard}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {questionSet.metadata.tags.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tag Paket Soal
                </h3>
                <div className="flex flex-wrap gap-2">
                  {questionSet.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Creator and Dates */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informasi Pembuat
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={questionSet.created_by.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Dibuat oleh</p>
                      <p className="font-medium text-gray-900">{questionSet.created_by.full_name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(questionSet.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(questionSet.updated_at)}
                      </p>
                    </div>
                  </div>

                  {questionSet.published_date && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Tanggal Publish</p>
                        <p className="font-medium text-gray-900">
                          {formatDateTime(questionSet.published_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions */}
            {questionSet.permission_holders && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Hak Akses
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {questionSet.permission_holders.can_edit.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dapat Edit</p>
                      <div className="space-y-2">
                        {questionSet.permission_holders.can_edit.map((user) => (
                          <div key={user._id} className="flex items-center space-x-2">
                            {user.profile_picture_key ? (
                              <img
                                src={getProfileImageUrl(user.profile_picture_key)}
                                alt={user.full_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="w-3 h-3 text-gray-500" />
                              </div>
                            )}
                            <span className="text-sm text-gray-700">{user.full_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {questionSet.permission_holders.can_manage_questions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dapat Kelola Soal</p>
                      <div className="space-y-2">
                        {questionSet.permission_holders.can_manage_questions.map((user) => (
                          <div key={user._id} className="flex items-center space-x-2">
                            {user.profile_picture_key ? (
                              <img
                                src={getProfileImageUrl(user.profile_picture_key)}
                                alt={user.full_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="w-3 h-3 text-gray-500" />
                              </div>
                            )}
                            <span className="text-sm text-gray-700">{user.full_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            ID: {questionSet._id}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
            
            {questionSet.can_manage_questions && (
              <button
                onClick={onManageQuestions}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Kelola Soal</span>
              </button>
            )}
            
            {questionSet.can_edit && (
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetDetailModal;