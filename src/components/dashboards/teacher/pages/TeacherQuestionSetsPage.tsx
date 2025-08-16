import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Filter, RotateCcw, Eye, Edit, Settings, BookOpen, Users, Calendar, Tag, Globe, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService, QuestionSet, QuestionSetFilters, CoordinationAssignment } from '@/services/questionSet';
import Pagination from '@/components/Pagination';
import QuestionSetFormModal from './modals/QuestionSetFormModal';
import QuestionSetDetailModal from './modals/QuestionSetDetailModal';
import QuestionSetManageQuestionsModal from './modals/QuestionSetManageQuestionsModal';
import QuestionSetDeleteModal from './modals/QuestionSetDeleteModal';
import QuestionSetPermissionModal from './modals/QuestionSetPermissionModal';
import { getProfileImageUrl } from '@/constants/config';
import toast from 'react-hot-toast';

const TeacherQuestionSetsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [myCoordinations, setMyCoordinations] = useState<CoordinationAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<QuestionSetFilters>({
    page: 1,
    limit: 20,
    search: '',
    grade_level: '',
    subject_id: '',
    status: '',
    is_public: undefined
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showManageQuestionsModal, setShowManageQuestionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<QuestionSet | null>(null);

  // Prevent multiple API calls with ref to track if initial fetch is done
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Only fetch question sets after initial data is loaded and filters are initialized
  useEffect(() => {
    if (initialFetchDone && filtersInitialized) {
      fetchQuestionSets();
    }
  }, [filters, initialFetchDone, filtersInitialized]);

  // Debounced search - only update filters after user stops typing
  useEffect(() => {
    if (!filtersInitialized) return;

    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters(prev => ({
          ...prev,
          search: searchQuery,
          page: 1
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filters.search, filtersInitialized]);

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      // Fetch user's coordinations to determine if they can create question sets
      const coordinations = await questionSetService.getMyCoordinations(token);
      setMyCoordinations(coordinations);
      setInitialFetchDone(true);
      
      // Initialize filters after getting coordinations
      setTimeout(() => {
        setFiltersInitialized(true);
      }, 0);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setInitialFetchDone(true);
      setFiltersInitialized(true);
    }
  };

  const fetchQuestionSets = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let response;
      if (filters.search && filters.search.trim()) {
        setSearchLoading(true);
        response = await questionSetService.searchQuestionSets(token, filters.search, {
          page: filters.page,
          limit: filters.limit,
          grade_level: filters.grade_level,
          subject_id: filters.subject_id,
          status: filters.status,
          is_public: filters.is_public
        });
      } else {
        response = await questionSetService.getQuestionSets(token, filters);
      }
      
      setQuestionSets(response.data);
      setTotalItems(response.total_items);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      toast.error('Gagal memuat paket soal');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (key: keyof QuestionSetFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      grade_level: '',
      subject_id: '',
      status: '',
      is_public: undefined
    });
    setSearchQuery('');
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCreateQuestionSet = () => {
    setSelectedQuestionSet(null);
    setShowCreateModal(true);
  };

  const handleViewQuestionSet = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowDetailModal(true);
  };

  const handleEditQuestionSet = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowCreateModal(true);
  };

  const handleManageQuestions = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowManageQuestionsModal(true);
  };

  const handleDeleteQuestionSet = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowDeleteModal(true);
  };

  const handleManagePermissions = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowPermissionModal(true);
  };

  const handleModalSuccess = () => {
    fetchQuestionSets();
    setShowCreateModal(false);
    setShowDetailModal(false);
    setShowManageQuestionsModal(false);
    setShowDeleteModal(false);
    setShowPermissionModal(false);
    setSelectedQuestionSet(null);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalItems / filters.limit);
  const canCreateQuestionSet = myCoordinations.length > 0;

  // Get unique subjects and grade levels for filters
  const availableSubjects = myCoordinations.reduce((acc, coord) => {
    if (!acc.find(s => s.id === coord.subject_id)) {
      acc.push({
        id: coord.subject_id,
        name: coord.subject_name,
        code: coord.subject_code
      });
    }
    return acc;
  }, [] as { id: string; name: string; code: string; }[]);

  const availableGradeLevels = [...new Set(myCoordinations.map(coord => coord.grade_level))].sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Paket Soal</h1>
              <p className="text-sm text-gray-600">Kelola dan tinjau paket soal pembelajaran</p>
            </div>
          </div>
          
          {canCreateQuestionSet && (
            <button
              onClick={handleCreateQuestionSet}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket Soal</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Filter Paket Soal</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari paket soal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Grade Level Filter */}
          <select
            value={filters.grade_level}
            onChange={(e) => handleFilterChange('grade_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Kelas</option>
            {availableGradeLevels.map((grade) => (
              <option key={grade} value={grade}>
                Kelas {getGradeLabel(grade)}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={filters.subject_id}
            onChange={(e) => handleFilterChange('subject_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Mata Pelajaran</option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={filters.is_public === undefined ? '' : filters.is_public.toString()}
            onChange={(e) => handleFilterChange('is_public', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Visibilitas</option>
            <option value="true">Publik</option>
            <option value="false">Pribadi</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
        
        {/* Active Filters Display */}
        {(filters.search || filters.grade_level || filters.subject_id || filters.status || filters.is_public !== undefined) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">Filter aktif:</span>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Pencarian: "{filters.search}"
                  </span>
                )}
                {filters.grade_level && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Kelas: {getGradeLabel(parseInt(filters.grade_level))}
                  </span>
                )}
                {filters.subject_id && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Mata Pelajaran: {availableSubjects.find(s => s.id === filters.subject_id)?.name}
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Status: {getStatusBadge(filters.status).label}
                  </span>
                )}
                {filters.is_public !== undefined && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Visibilitas: {filters.is_public ? 'Publik' : 'Pribadi'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Sets Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                <span className="text-gray-600">Memuat paket soal...</span>
              </div>
            </div>
          ) : questionSets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.grade_level || filters.subject_id || filters.status || filters.is_public !== undefined
                  ? 'Tidak ada paket soal yang sesuai filter'
                  : 'Belum ada paket soal'
                }
              </h3>
              <p className="text-gray-600 mb-3">
                {filters.search || filters.grade_level || filters.subject_id || filters.status || filters.is_public !== undefined
                  ? 'Coba ubah atau reset filter untuk melihat paket soal lainnya'
                  : canCreateQuestionSet 
                    ? 'Mulai dengan membuat paket soal pertama Anda'
                    : 'Belum ada paket soal yang tersedia untuk Anda'
                }
              </p>
              {!(filters.search || filters.grade_level || filters.subject_id || filters.status || filters.is_public !== undefined) && canCreateQuestionSet && (
                <button
                  onClick={handleCreateQuestionSet}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Paket Soal Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paket Soal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Kelas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Soal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pembuat
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questionSets.map((questionSet) => {
                    const statusInfo = getStatusBadge(questionSet.status);
                    const profileImageUrl = questionSet.created_by.profile_picture_key 
                      ? getProfileImageUrl(questionSet.created_by.profile_picture_key)
                      : null;

                    return (
                      <tr key={questionSet._id} className="hover:bg-gray-50 transition-colors">
                        {/* Paket Soal */}
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {questionSet.name}
                              </h3>
                              {questionSet.is_public ? (
                                <Globe className="w-3 h-3 text-green-500 flex-shrink-0" title="Publik" />
                              ) : (
                                <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" title="Pribadi" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {questionSet.description}
                            </p>
                            {questionSet.metadata.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {questionSet.metadata.tags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                  >
                                    <Tag className="w-2.5 h-2.5 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                                {questionSet.metadata.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{questionSet.metadata.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Mata Pelajaran */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {questionSet.subject.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {questionSet.subject.code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kelas - Fixed with whitespace-nowrap */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900">
                              Kelas {getGradeLabel(questionSet.grade_level)}
                            </span>
                          </div>
                        </td>

                        {/* Soal - Fixed with whitespace-nowrap */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {questionSet.metadata.total_questions} soal
                            </div>
                            <div className="text-xs text-gray-500">
                              {questionSet.metadata.total_points} poin
                            </div>
                            {questionSet.metadata.total_questions > 0 && (
                              <div className="flex space-x-1 mt-1 w-20">
                                <div 
                                  className="bg-green-200 h-1.5 rounded-l"
                                  style={{ 
                                    width: `${(questionSet.metadata.difficulty_distribution.easy / questionSet.metadata.total_questions) * 100}%`,
                                    minWidth: questionSet.metadata.difficulty_distribution.easy > 0 ? '4px' : '0'
                                  }}
                                  title={`Mudah: ${questionSet.metadata.difficulty_distribution.easy}`}
                                ></div>
                                <div 
                                  className="bg-yellow-200 h-1.5"
                                  style={{ 
                                    width: `${(questionSet.metadata.difficulty_distribution.medium / questionSet.metadata.total_questions) * 100}%`,
                                    minWidth: questionSet.metadata.difficulty_distribution.medium > 0 ? '4px' : '0'
                                  }}
                                  title={`Sedang: ${questionSet.metadata.difficulty_distribution.medium}`}
                                ></div>
                                <div 
                                  className="bg-red-200 h-1.5 rounded-r"
                                  style={{ 
                                    width: `${(questionSet.metadata.difficulty_distribution.hard / questionSet.metadata.total_questions) * 100}%`,
                                    minWidth: questionSet.metadata.difficulty_distribution.hard > 0 ? '4px' : '0'
                                  }}
                                  title={`Sulit: ${questionSet.metadata.difficulty_distribution.hard}`}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Pembuat */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {profileImageUrl ? (
                              <img
                                src={profileImageUrl}
                                alt={questionSet.created_by.full_name}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-3 h-3 text-gray-500" />
                              </div>
                            )}
                            <span className="text-sm text-gray-900 truncate">
                              {questionSet.created_by.full_name}
                            </span>
                          </div>
                        </td>

                        {/* Tanggal - Fixed with whitespace-nowrap */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{formatDate(questionSet.created_at)}</span>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleViewQuestionSet(questionSet)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {questionSet.is_creator && (
                              <button
                                onClick={() => handleManagePermissions(questionSet)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                                title="Kelola Izin"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                            )}
                            
                            {questionSet.can_manage_questions && (
                              <button
                                onClick={() => handleManageQuestions(questionSet)}
                                className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
                                title="Kelola Soal"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            )}
                            
                            {questionSet.can_edit && (
                              <button
                                onClick={() => handleEditQuestionSet(questionSet)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {questionSet.is_creator && (
                              <button
                                onClick={() => handleDeleteQuestionSet(questionSet)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={filters.limit}
              itemName="paket soal"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <QuestionSetFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          myCoordinations={myCoordinations}
          questionSet={selectedQuestionSet}
        />
      )}

      {showDetailModal && selectedQuestionSet && (
        <QuestionSetDetailModal
          questionSet={selectedQuestionSet}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            setShowCreateModal(true);
          }}
          onManageQuestions={() => {
            setShowDetailModal(false);
            setShowManageQuestionsModal(true);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            setShowDeleteModal(true);
          }}
        />
      )}

      {showManageQuestionsModal && selectedQuestionSet && (
        <QuestionSetManageQuestionsModal
          questionSet={selectedQuestionSet}
          isOpen={showManageQuestionsModal}
          onClose={() => setShowManageQuestionsModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showDeleteModal && selectedQuestionSet && (
        <QuestionSetDeleteModal
          questionSet={selectedQuestionSet}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

    {showPermissionModal && selectedQuestionSet && (
      <QuestionSetPermissionModal
        questionSet={selectedQuestionSet}
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onSuccess={handleModalSuccess}
        myCoordinations={myCoordinations}
      />
    )}
    </div>
  );
};

export default TeacherQuestionSetsPage;