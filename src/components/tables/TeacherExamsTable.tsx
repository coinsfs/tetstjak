import React from 'react';
import {
  FileText,
  Play,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { TeacherExam } from '@/services/teacherExam';
import { formatDateTimeWithTimezone } from '@/utils/timezone';

interface TeacherExamsTableProps {
  exams: TeacherExam[];
  loading: boolean;
  onCreateExam: () => void;
  onStartExam: (exam: TeacherExam) => void;
  onEditExam: (exam: TeacherExam) => void;
  onDeleteExam: (exam: TeacherExam) => void;
  onInputQuestions: (exam: TeacherExam) => void;
  onMonitorExam: (exam: TeacherExam) => void;
  onAnalyticsExam: (exam: TeacherExam) => void;
  onViewExamDetail: (exam: TeacherExam) => void;
}

const TeacherExamsTable: React.FC<TeacherExamsTableProps> = ({
  exams,
  loading,
  onCreateExam,
  onStartExam,
  onEditExam,
  onDeleteExam,
  onInputQuestions,
  onMonitorExam,
  onAnalyticsExam,
  onViewExamDetail,
}) => {
  console.log("🔍 TeacherExamsTable received exams:", exams); // Log exams array
  console.log("🔍 TeacherExamsTable rendering", exams.length, "items."); // Log count of items being rendered
  console.log("🔍 TeacherExamsTable loading state:", loading); // Log loading state

  const getExamTypeLabel = (examType: string) => {
    const typeLabels: { [key: string]: string } = {
      quiz: 'Kuis',
      daily_test: 'Ulangan Harian (UH)',
    };
    return typeLabels[examType] || examType;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_questions: {
        label: 'Menunggu Soal',
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle,
      },
      ready: {
        label: 'Siap',
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
      },
      ongoing: {
        label: 'Berlangsung',
        color: 'bg-green-100 text-green-800',
        icon: Play,
      },
      completed: {
        label: 'Selesai',
        color: 'bg-purple-100 text-purple-800',
        icon: CheckCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.pending_questions;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <IconComponent className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const getActionButtons = (exam: TeacherExam) => {
    const { status } = exam;
    const buttons = [];

    // Detail Button - Always available as first button
    buttons.push(
      <button
        key="detail"
        onClick={() => onViewExamDetail(exam)}
        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        title="Lihat Detail Ujian"
      >
        <Eye className="w-4 h-4" />
      </button>
    );

    // Monitor/Analytics Button - Based on status
    if (status === 'ongoing') {
      buttons.push(
        <button
          key="monitor"
          onClick={() => onMonitorExam(exam)}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
          title="Monitoring Ujian"
        >
          <Eye className="w-4 h-4" />
        </button>
      );
    } else if (status === 'completed') {
      buttons.push(
        <button
          key="analytics"
          onClick={() => onAnalyticsExam(exam)}
          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
          title="Lihat Analitik"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      );
    }

    // Input Questions Button - Available for pending_questions and ready status
    if (status === 'pending_questions' || status === 'ready') {
      buttons.push(
        <button
          key="input-questions"
          onClick={() => onInputQuestions(exam)}
          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
          title="Input Soal"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      );
    }

    return buttons;
  };

  const isDeleteDisabled = (exam: TeacherExam) => {
    return (
      exam.status === 'ongoing' ||
      exam.status === 'completed' ||
      exam.exam_type === 'official_uts' ||
      exam.exam_type === 'official_uas'
    );
  };

  const formatDateTime = (dateString: string) => {
    return formatDateTimeWithTimezone(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
          <span className="text-gray-600">Memuat daftar ujian...</span>
        </div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
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
          onClick={onCreateExam}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Ujian Pertama</span>
        </button>
      </div>
    );
  }

  return (
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
                    <span className="truncate">
                      Mulai: {formatDateTimeWithTimezone(exam.availability_start_time)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate">
                      Selesai: {formatDateTimeWithTimezone(exam.availability_end_time)}
                    </span>
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
                  {/* Start Button - Special styling for primary action */}
                  <button
                    onClick={() => onStartExam(exam)}
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

                  {/* Action Icon Buttons */}
                  {getActionButtons(exam).map((button, index) => (
                    <React.Fragment key={index}>{button}</React.Fragment>
                  ))}

                  {/* Edit Button */}
                  <button
                    onClick={() => onEditExam(exam)}
                    disabled={
                      exam.status === 'ongoing' || exam.status === 'completed'
                    }
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
                    onClick={() => onDeleteExam(exam)}
                    disabled={isDeleteDisabled(exam)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDeleteDisabled(exam)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={
                      exam.exam_type === 'official_uts' ||
                      exam.exam_type === 'official_uas'
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
  );
};

export default TeacherExamsTable;