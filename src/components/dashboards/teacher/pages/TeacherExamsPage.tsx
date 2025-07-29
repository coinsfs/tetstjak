import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Filter,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Edit,
  Trash2,
  Play,
  Eye,
  BarChart3,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';

const TeacherExamsPage: React.FC = () => {
  const { token, user } = useAuth();
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

  const handleExamAction = (exam: TeacherExam, action: string) => {
    switch (action) {
      case 'input_questions':
        handleInputQuestions(exam);
        break;
      case 'start':
        toast.info('Fitur mulai ujian akan segera tersedia');
        break;
      case 'monitor':
        toast.info('Fitur monitoring akan segera tersedia');
        break;
      case 'analytics':
        toast.info('Fitur analitik akan segera tersedia');
        break;
      default:
        break;
    }
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
      'starting': { 
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

  const getActionButton = (exam: TeacherExam) => {
    const { status } = exam;
    
    switch (status) {
      case 'pending_questions':
        return (
          <button
            onClick={() => handleExamAction(exam, 'input_questions')}
            className="flex items-center space-x-1 px-2 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs whitespace-nowrap"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Input Soal</span>
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleExamAction(exam, 'start')}
            className="flex items-center space-x-1 px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs whitespace-nowrap"
          >
            <Play className="w-3 h-3" />
            <span>Mulai</span>
          </button>
        );
      case 'starting':
        return (
          <button
            onClick={() => handleExamAction(exam, 'monitor')}
            className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs whitespace-nowrap"
          >
            <Eye className="w-3 h-3" />
            <span>Monitoring</span>
          </button>
        );
      case 'completed':
        return (
          <button
            onClick={() => handleExamAction(exam, 'analytics')}
            className="flex items-center space-x-1 px-2 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs whitespace-nowrap"
          >
            <BarChart3 className="w-3 h-3" />
            <span>Analitik</span>
          </button>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeleteDisabled = (exam: TeacherExam) => {
    return exam.status === 'active' || exam.status === 'completed' || 
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
      {/* FIX: Terapkan kelas 'teacher-exam-table-container' pada container utama tabel.
        Ini akan bekerja sama dengan 'overflow-x: hidden' yang ada di index.css
        untuk memastikan container ini tidak menyebabkan scroll pada page.
      */}
      <div className="teacher-exam-table-container">
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
          /*
            FIX: Ganti 'overflow-x-auto' dengan 'teacher-exam-table-scroll'.
            Ini akan menerapkan style scrollbar kustom dan memastikan perilaku scroll yang benar.
          */
          <div className="teacher-exam-table-scroll">
            {/* FIX: Terapkan kelas 'teacher-exam-table' dan hapus 'min-w-full'.
              Kelas ini akan mengaktifkan 'table-layout: fixed' dan lebar kolom spesifik
              dari CSS Anda, yang merupakan kunci untuk kontrol layout tabel.
            */}
            <table className="teacher-exam-table">
              <thead>
                <tr>
                  {/* Hapus className dari <th> dan <td> karena sudah diatur di index.css */}
                  <th>Ujian</th>
                  <th>Jenis</th>
                  <th>Status</th>
                  <th>Jadwal</th>
                  <th>Durasi</th>
                  <th>Soal</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    {/* Ujian */}
                    <td>
                      <div className="teacher-exam-cell-content" title={exam.title}>
                        <div className="text-sm font-medium text-gray-900">
                          {exam.title}
                        </div>
                        <p className="text-sm text-gray-500">
                          ID: {exam._id.slice(-8)}
                        </p>
                      </div>
                    </td>
                    
                    {/* Jenis */}
                    <td>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getExamTypeLabel(exam.exam_type)}
                      </span>
                    </td>
                    
                    {/* Status */}
                    <td>
                      {getStatusBadge(exam.status)}
                    </td>
                    
                    {/* Jadwal */}
                    <td>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-1 text-gray-900">
                          <Calendar className="w-3 h-3" />
                          <span>Mulai: {formatDateTime(exam.availability_start_time)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Selesai: {formatDateTime(exam.availability_end_time)}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Durasi */}
                    <td>
                      <div className="flex items-center space-x-1 text-sm text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{exam.duration_minutes} menit</span>
                      </div>
                    </td>
                    
                    {/* Soal */}
                    <td>
                      <div className="flex items-center space-x-1 text-sm text-gray-900">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{exam.question_ids.length} soal</span>
                      </div>
                    </td>
                    
                    {/* Aksi */}
                    <td>
                      <div className="teacher-exam-action-buttons">
                        {getActionButton(exam)}
                        
                        <button
                          onClick={() => handleEditExam(exam)}
                          disabled={exam.status === 'active' || exam.status === 'completed'}
                          className={`p-2 rounded-lg transition-colors ${
                            exam.status === 'active' || exam.status === 'completed'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Edit Ujian"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
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
                              : exam.status === 'active' || exam.status === 'completed'
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
    </div>
  );
};

export default TeacherExamsPage;