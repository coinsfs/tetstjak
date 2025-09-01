```typescript
import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
// Removed useRouter import as URL will not be manipulated for pagination
// import { useRouter } from "@/hooks/useRouter"; 
import {
  teacherExamService,
  TeacherExam,
  TeacherExamFilters,
  AcademicPeriod,
  ActiveAcademicPeriod,
} from "@/services/teacherExam";
import { teacherService, TeachingClass } from "@/services/teacher";
import TeacherExamFormModal from "./modals/TeacherExamFormModal";
import TeacherExamDeleteModal from "./modals/TeacherExamDeleteModal";
import TeacherExamEditModal from "./modals/TeacherExamEditModal";
import TeacherExamQuestionsModal from "./modals/TeacherExamQuestionsModal";
import TeacherExamStartConfirmationModal from "./modals/TeacherExamStartConfirmationModal";
import ExamDetailModal from "@/components/modals/details/ExamDetailModal";
import TeacherExamsTable from "@/components/tables/TeacherExamsTable";
import Pagination from "@/components/Pagination";
// Removed formatDateTimeWithTimezone, convertUTCToWIB as they are not directly used here
// import { formatDateTimeWithTimezone, convertUTCToWIB } from "@/utils/timezone";
import toast from "react-hot-toast";

const TeacherExamsPage: React.FC = () => {
  const { token, user } = useAuth();
  // Removed useRouter usage
  // const { navigate, currentPath } = useRouter(); 
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); 
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] =
    useState<ActiveAcademicPeriod | null>(null);

  // Filters state, now managed purely internally without URL synchronization
  const [filters, setFilters] = useState<TeacherExamFilters>({
    page: 1,
    limit: 10, // Default to 10 items per page
    academic_period_id: undefined,
    class_id: undefined,
  });

  // Removed useEffect that synced filters with currentPath
  // useEffect(() => {
  //   const urlFilters = getFiltersFromUrl();
  //   if (
  //     urlFilters.page !== filters.page ||
  //     urlFilters.limit !== filters.limit ||
  //     urlFilters.academic_period_id !== filters.academic_period_id ||
  //     urlFilters.class_id !== filters.class_id
  //   ) {
  //     setFilters(urlFilters);
  //   }
  // }, [currentPath, getFiltersFromUrl, filters]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [filters, token]); // fetchExams will now react to changes in filters and token

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      const [academicPeriodsData, teachingData, activeAcademicData] =
        await Promise.all([
          teacherExamService.getAcademicPeriods(token),
          teacherService.getTeachingSummary(token),
          teacherExamService.getActiveAcademicPeriod(token),
        ]);

      setAcademicPeriods(academicPeriodsData);
      setTeachingClasses(teachingData.classes);
      setActiveAcademicPeriod(activeAcademicData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Gagal memuat data awal");
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
      console.error("Error fetching exams:", error);
      toast.error("Gagal memuat daftar ujian");
    } finally {
      setLoading(false);
    }
  };

  // Modified handleFilterChange to update internal state directly
  const handleFilterChange = useCallback((key: keyof TeacherExamFilters, value: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value === '' ? undefined : value, // Handle empty string for select inputs
      page: 1, // Reset to first page when filtering
    }));
  }, []);

  // Modified handlePageChange to update internal state directly
  const handlePageChange = useCallback((page: number) => {
    setFilters(prevFilters => ({ ...prevFilters, page }));
  }, []);

  // Modified handleItemsPerPageChange to update internal state directly
  const handleItemsPerPageChange = useCallback((newLimit: number) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      limit: newLimit,
      page: 1, // Reset to first page when limit changes
    }));
  }, []);

  const handleCreateExam = useCallback(() => {
    if (!activeAcademicPeriod) {
      toast.error(
        "Tidak ada periode akademik yang aktif. Hubungi administrator."
      );
      return;
    }
    setShowCreateModal(true);
  }, [activeAcademicPeriod]);

  const handleEditExam = useCallback((exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowEditModal(true);
  }, []);

  const handleDeleteExam = useCallback((exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowDeleteModal(true);
  }, []);

  const handleInputQuestions = useCallback((exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowQuestionsModal(true);
  }, []);

  const handleStartExam = useCallback((exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowStartConfirmationModal(true);
  }, []);

  // Removed navigate call for monitor exam, as it's a different route
  // If you still want to navigate to a different route, you'll need useRouter back for this specific case
  const handleMonitorExam = useCallback((exam: TeacherExam) => {
    if (exam.status === "ongoing") {
      const totalQuestions = exam.question_ids.length;
      // If you need to navigate to a different route, you'll need to re-introduce useRouter for this specific function
      // For now, this will just log to console as per the requirement of not changing frontend URL
      console.log(\`Navigating to monitor exam: /monitor-exam/${exam._id}?totalQuestions=${totalQuestions}`);
      toast.info("Navigasi ke halaman monitoring ujian (URL tidak berubah)");
    } else {
      toast.error("Ujian belum dimulai atau sudah selesai.");
    }
  }, []);

  const handleAnalyticsExam = useCallback((exam: TeacherExam) => {
    // TODO: Implement analytics functionality
    toast.success("Fitur analitik akan segera tersedia");
  }, []);

  const handleViewExamDetail = useCallback((exam: TeacherExam) => {
    setSelectedExam(exam);
    setShowDetailModal(true);
  }, []);

  // Convert TeacherExam to Exam format for ExamDetailModal
  const convertToExamFormat = useCallback((teacherExam: TeacherExam): any => {
    const taDetails = teacherExam.teaching_assignment_details || {};

    return {
      ...teacherExam,
      questions: teacherExam.question_ids, 
      question_ids: teacherExam.question_ids, 
      teaching_assignment_details: {
        ...taDetails,
        class_details: taDetails.class_details || {},
        subject_details: taDetails.subject_details || {},
        teacher_details: taDetails.teacher_details || {},
      }
    };
  }, []);

  const totalPages = Math.ceil(totalItems / (filters.limit || 10));

  // Modal state variables
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showStartConfirmationModal, setShowStartConfirmationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<TeacherExam | null>(null);


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
              <h1 className="text-2xl font-bold text-gray-900">
                Manajemen Ujian
              </h1>
              <p className="text-gray-600">
                Kelola ujian dan soal pembelajaran
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateExam}
            disabled={!activeAcademicPeriod}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !activeAcademicPeriod
                ? "Tidak ada periode akademik aktif"
                : "Buat ujian baru"
            }
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
            value={filters.academic_period_id || ""}
            onChange={(e) =>
              handleFilterChange(
                "academic_period_id",
                e.target.value || undefined
              )
            }
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
            value={filters.class_id || ""}
            onChange={(e) =>
              handleFilterChange("class_id", e.target.value || undefined)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
          >
            <option value="">Semua Kelas</option>
            {teachingClasses.map((teachingClass, index) => (
              <option key={index} value={teachingClass.class_details._id}>
                Kelas {teachingClass.class_details.grade_level}{" "}
                {teachingClass.expertise_details.abbreviation}{" "}
                {teachingClass.class_details.name}
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
                Saat ini tidak ada periode akademik yang aktif. Anda tidak dapat
                membuat ujian baru. Silakan hubungi administrator untuk
                mengaktifkan periode akademik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TeacherExamsTable
          exams={exams}
          loading={loading}
          onStartExam={handleStartExam}
          onEditExam={handleEditExam}
          onDeleteExam={handleDeleteExam}
          onInputQuestions={handleInputQuestions}
          onMonitorExam={handleMonitorExam}
          onAnalyticsExam={handleAnalyticsExam}
          onViewExamDetail={handleViewExamDetail}
          onCreateExam={handleCreateExam}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalRecords={totalItems}
            recordsPerPage={filters.limit || 10}
            onLimitChange={handleItemsPerPageChange}
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
          currentUserId={user?._id || ""}
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
      
      {showDetailModal && selectedExam && (
        <ExamDetailModal
          exam={convertToExamFormat(selectedExam)}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedExam(null);
          }}
        />
      )}
    </div>
  );
};

export default TeacherExamsPage;
```