import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Play,
  Plus, 
  Filter,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { 
  teacherExamService, 
  TeacherExam, 
  TeacherExamFilters,
  AcademicPeriod,
  ActiveAcademicPeriod
} from '@/services/teacherExam';
import { teacherService, TeachingClass } from '@/services/teacher';
import TeacherExamFormModal from './modals/TeacherExamFormModal';
import TeacherExamDeleteModal from './modals/TeacherExamDeleteModal';
import TeacherExamEditModal from './modals/TeacherExamEditModal';
import TeacherExamQuestionsModal from './modals/TeacherExamQuestionsModal';
import TeacherExamStartConfirmationModal from './modals/TeacherExamStartConfirmationModal';
import Pagination from '@/components/Pagination';
import { formatDateTimeWithTimezone, convertUTCToWIB } from '@/utils/timezone';
import toast from 'react-hot-toast';

const TeacherExamsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { navigate } = useRouter();
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<ActiveAcademicPeriod | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TeacherExamFilters>({
    page: 1,
    limit: 10
  });
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showStartConfirmationModal, setShowStartConfirmationModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<TeacherExam | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      const [academicPeriodsData, teachingData, activeAcademicData] = await Promise.all([
        teacherExamService.getAcademicPeriods(token),
        teacherService.getTeachingSummary(token),
        teacherExamService.getActiveAcademicPeriod(token)
      ]);
      
      setAcademicPeriods(academicPeriodsData);
      setTeachingClasses(teachingData.classes);
      setActiveAcademicPeriod(activeAcademicData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data awal');
    }
  };

  const fetchExams = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await teacherExamService.getTeacherExams(token, filters);
      setExams(response.data);
      setTotalItems(response.total_items);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Gagal memuat daftar ujian');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TeacherExamFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCreateExam = () => {
    if (!activeAcademicPeriod) {
      toast.error('Tidak ada periode akademik yang aktif. Hubungi administrator.');
      return;
    }
    setShowCreateModal(true);
  };

  const handleEditExam = (exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowEditModal(true);
  };

  const handleDeleteExam = (exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowDeleteModal(true);
  };

  const handleInputQuestions = (exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowQuestionsModal(true);
  };

  const handleStartExam = (exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowStartConfirmationModal(true);
  };

  const handleMonitorExam = (exam: TeacherExam) => {
    if (exam.status === 'ongoing') {
      navigate(`/monitor-exam/${exam._id}`);
    } else {
      // For testing purposes, allow monitoring even if not ongoing
      console.log('Exam status:', exam.status);
      navigate(`/monitor-exam/${exam._id}`);
      // toast.error('Ujian belum berlangsung atau sudah selesai.');
    }
  };

  const handleAnalyticsExam = (exam: TeacherExam) => {
    // TODO: Implement analytics functionality
    toast.success('Fitur analitik akan segera tersedia');
  };

  const getExamTypeLabel = (examType: string) => {
    const typeLabels: { [key: string]: string } = {
      'quiz': 'Kuis',
      'daily_test': 'Ulangan Harian (UH)',
    };
    return typeLabels[examType] || examType;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_questions': { 
        label: 'Menunggu Soal', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle 
      },
      'ready': { 
        label: 'Siap', 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle 
      },
      'ongoing': { 
        label: 'Berlangsung', 
        color: 'bg-green-100 text-green-800', 
        icon: Play 
      },
      'completed': { 
        label: 'Selesai', 
        color: 'bg-purple-100 text-purple-800', 
        icon: CheckCircle 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_questions;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    return formatDateTimeWithTimezone(dateString);
  };

  
  const getActionButtons = (exam: TeacherExam) => {
  const { status } = exam;
  const buttons = [];

  // Monitor/Analytics Button - Based on status
  if (status === 'ongoing') {
    buttons.push(
      <button
        key="monitor"
        onClick={() => handleMonitorExam(exam)}
        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
      >
        <Eye className="w-3 h-3" />
        <span>Monitoring</span>
      </button>
    );
  } else if (status === 'completed') {
    buttons.push(
      <button
        key="analytics"
        onClick={() => handleAnalyticsExam(exam)}
        className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
      >
        <BarChart3 className="w-3 h-3" />
        <span>Analitik</span>
      </button>
    );
  }

  // Input Questions Button - Always available for pending_questions and ready status (MOVED TO SECOND)
  if (status === 'pending_questions' || status === 'ready') {
    buttons.push(
      <button
        key="input-questions"
        onClick={() => handleInputQuestions(exam)}
        className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
      >
        <HelpCircle className="w-3 h-3" />
        <span>Input Soal</span>
      </button>
    );
  }

  return buttons;
};

  const isDeleteDisabled = (exam: TeacherExam) => {
    return exam.status === 'ongoing' || exam.status === 'completed' || 
           exam.exam_type === 'official_uts' || exam.exam_type === 'official_uas';
  };

  const totalPages = Math.ceil(totalItems / (filters.limit || 10));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Ujian</h1>
              <p className="text-gray-600">Kelola ujian dan soal pembelajaran</p>
            </div>
          </div>
          
          <button
            onClick={handleCreateExam}
            disabled={!activeAcademicPeriod}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!activeAcademicPeriod ? 'Tidak ada periode akademik aktif' : 'Buat ujian baru'}
          >
            <Plus className="w-5 h-5" />
            <span>Buat Ujian</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Ujian</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Academic Period Filter */}
          <select
            value={filters.academic_period_id || ''}
            onChange={(e) => handleFilterChange('academic_period_id', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Periode Akademik</option>
            {academicPeriods.map((period) => (
              <option key={period._id} value={period._id}>
                {period.year} - Semester {period.semester}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={filters.class_id || ''}
            onChange={(e) => handleFilterChange('class_id', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Kelas</option>
            {teachingClasses.map((teachingClass, index) => (
              <option key={index} value={teachingClass.class_details._id}>
                Kelas {teachingClass.class_details.grade_level} {teachingClass.expertise_details.abbreviation} {teachingClass.class_details.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Academic Period Warning */}
      {!activeAcademicPeriod && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Periode Akademik Tidak Aktif
              </h4>
              <p className="text-sm text-yellow-700">
                Saat ini tidak ada periode akademik yang aktif. Anda tidak dapat membuat ujian baru. 
                Silakan hubungi administrator untuk mengaktifkan periode akademik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-gray-600">Memuat daftar ujian...</span>
            </div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Ujian
            </h3>
            <p className="text-gray-600 mb-4">
              Anda belum membuat ujian apapun. Mulai dengan membuat ujian pertama Anda.
            </p>
            <button
              onClick={handleCreateExam}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Ujian Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ujian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jadwal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soal
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    {/* Ujian */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {exam.title}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          ID: {exam._id.slice(-8)}
                        </p>
                      </div>
                    </td>
                    
                    {/* Jenis */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getExamTypeLabel(exam.exam_type)}
                      </span>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(exam.status)}
                    </td>
                    
                    {/* Jadwal */}
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-1 text-gray-900">
                          <Calendar className="w-3 h-3" />
                          <span className="truncate">Mulai: {formatDateTime(exam.availability_start_time)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span className="truncate">Selesai: {formatDateTime(exam.availability_end_time)}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Durasi */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{exam.duration_minutes} menit</span>
                      </div>
                    </td>
                    
                    {/* Soal */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-gray-900">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{exam.question_ids.length} soal</span>
                      </div>
                    </td>
                    
                    {/* Aksi */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Start Button - Always first, disabled if not ready */}
                        <button
                          onClick={() => handleStartExam(exam)}
                          disabled={exam.status !== 'ready'}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap shadow-sm ${
                            exam.status === 'ready'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={
                            exam.status === 'ready' 
                              ? 'Mulai ujian' 
                              : 'Ujian belum siap dimulai'
                          }
                        >
                          <Play className="w-3 h-3" />
                          <span>Mulai</span>
                        </button>
                        
                        {/* Action Buttons */}
                        {getActionButtons(exam).map((button, index) => (
                          <React.Fragment key={index}>
                            {button}
                          </React.Fragment>
                        ))}
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditExam(exam)}
                          disabled={exam.status === 'ongoing' || exam.status === 'completed'}
                          className={`p-2 rounded-lg transition-colors ${
                            exam.status === 'ongoing' || exam.status === 'completed'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Edit Ujian"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteExam(exam)}
                          disabled={isDeleteDisabled(exam)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDeleteDisabled(exam)
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={
                            exam.exam_type === 'official_uts' || exam.exam_type === 'official_uas'
                              ? 'Ujian resmi tidak dapat dihapus'
                              : exam.status === 'ongoing' || exam.status === 'completed'
                              ? 'Ujian yang sedang berlangsung atau selesai tidak dapat dihapus'
                              : 'Hapus Ujian'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={filters.limit || 10}
            itemName="ujian"
          />
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TeacherExamFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchExams();
          }}
          teachingClasses={teachingClasses}
          currentUserId={user?._id || ''}
          activeAcademicPeriod={activeAcademicPeriod}
        />
      )}

      {showDeleteModal && selectedExam && (
        <TeacherExamDeleteModal
          exam={selectedExam}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setSelectedExam(null);
            fetchExams();
          }}
        />
      )}

      {showEditModal && selectedExam && (
        <TeacherExamEditModal
          exam={selectedExam}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedExam(null);
            fetchExams();
          }}
        />
      )}

      {showQuestionsModal && selectedExam && (
        <TeacherExamQuestionsModal
          exam={selectedExam}
          isOpen={showQuestionsModal}
          onClose={() => {
            setShowQuestionsModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            setShowQuestionsModal(false);
            setSelectedExam(null);
            fetchExams();
          }}
          teachingClasses={teachingClasses}
        />
      )}
      {showStartConfirmationModal && selectedExam && (
        <TeacherExamStartConfirmationModal
          exam={selectedExam}
          isOpen={showStartConfirmationModal}
          onClose={() => {
            setShowStartConfirmationModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            setShowStartConfirmationModal(false);
            setSelectedExam(null);
            fetchExams();
          }}
        />
      )}
    </div>
  );
};

export default TeacherExamsPage;