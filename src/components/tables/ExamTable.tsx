import React, { memo } from 'react';
import { Edit, Trash2, FileText, Calendar, Clock, User, BarChart3, Eye } from 'lucide-react';
import { Exam } from '@/types/exam';

// Status configuration based on API data
const EXAM_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_questions', label: 'Menunggu Soal', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ready', label: 'Siap', color: 'bg-blue-100 text-blue-800' },
  { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Selesai', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
];

// Exam type labels based on API data
const EXAM_TYPE_LABELS: { [key: string]: string } = {
  'official_uts': 'UTS',
  'official_uas': 'UAS',
  'quiz': 'Kuis',
  'daily_test': 'Ulangan Harian'
};

interface ExamTableProps {
  exams: Exam[];
  loading: boolean;
  onViewExam: (exam: Exam) => void;
  onPrefetchExam: (examId: string) => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (exam: Exam) => void;
  onAnalyticsExam: (exam: Exam) => void;
}

const ExamTable: React.FC<ExamTableProps> = memo(({
  exams,
  loading,
  onViewExam,
  onPrefetchExam,
  onEditExam,
  onDeleteExam,
  onAnalyticsExam
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = EXAM_STATUS.find(s => s.value === status) || EXAM_STATUS[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getExamTypeLabel = (examType: string) => {
    return EXAM_TYPE_LABELS[examType] || examType;
  };

  const formatClassDisplay = (classDetails: any) => {
    if (!classDetails) return 'Kelas tidak tersedia';
    
    const gradeLevel = classDetails.grade_level || '';
    const expertiseAbbr = classDetails.expertise_details?.abbreviation || '';
    const className = classDetails.name || '';
    
    return `${gradeLevel} ${expertiseAbbr} ${className}`.trim();
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data ujian</h3>
          <p className="text-gray-500">
            {loading ? 'Memuat data ujian...' : 'Belum ada ujian yang terdaftar atau sesuai dengan pencarian yang dilakukan.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '250px', maxWidth: '300px' }}>
                Judul Ujian
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '180px', maxWidth: '220px' }}>
                Mata Pelajaran
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px', maxWidth: '150px' }}>
                Kelas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px', maxWidth: '120px' }}>
                Jenis Ujian
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px', maxWidth: '100px' }}>
                Durasi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px', maxWidth: '160px' }}>
                Waktu Mulai
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px', maxWidth: '160px' }}>
                Waktu Selesai
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px', maxWidth: '120px' }}>
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px', maxWidth: '150px' }}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => (
              <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                {/* Judul Ujian */}
                <td className="px-4 py-4" style={{ minWidth: '250px', maxWidth: '300px' }}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 break-words leading-tight">
                        {exam.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {exam._id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Mata Pelajaran */}
                <td className="px-4 py-4" style={{ minWidth: '180px', maxWidth: '220px' }}>
                  <div className="text-sm font-medium text-gray-900 break-words leading-tight">
                    {exam.teaching_assignment_details?.subject_details?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Kode: {exam.teaching_assignment_details?.subject_details?.code || 'N/A'}
                  </div>
                </td>

                {/* Kelas */}
                <td className="px-4 py-4" style={{ minWidth: '120px', maxWidth: '150px' }}>
                  <div className="text-sm font-medium text-gray-900 break-words leading-tight">
                    {formatClassDisplay(exam.teaching_assignment_details?.class_details)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    TA: {exam.teaching_assignment_details?.class_details?.academic_year || 'N/A'}
                  </div>
                </td>

                {/* Jenis Ujian */}
                <td className="px-4 py-4" style={{ minWidth: '100px', maxWidth: '120px' }}>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getExamTypeLabel(exam.exam_type)}
                  </span>
                </td>

                {/* Durasi */}
                <td className="px-4 py-4" style={{ minWidth: '80px', maxWidth: '100px' }}>
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="font-medium">{exam.duration_minutes}</span>
                    <span className="text-xs text-gray-500 ml-1">mnt</span>
                  </div>
                </td>

                {/* Waktu Mulai */}
                <td className="px-4 py-4" style={{ minWidth: '140px', maxWidth: '160px' }}>
                  <div className="text-sm text-gray-900 break-words leading-tight">
                    {formatDateTime(exam.availability_start_time)}
                  </div>
                </td>

                {/* Waktu Selesai */}
                <td className="px-4 py-4" style={{ minWidth: '140px', maxWidth: '160px' }}>
                  <div className="text-sm text-gray-900 break-words leading-tight">
                    {formatDateTime(exam.availability_end_time)}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4" style={{ minWidth: '100px', maxWidth: '120px' }}>
                  <div>
                    {getStatusBadge(exam.status)}
                    <div className="text-xs text-gray-500 mt-1">
                      Pengawas: {exam.proctor_ids?.length || 0}
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4" style={{ minWidth: '120px', maxWidth: '150px' }}>
                  <div className="flex items-center justify-center space-x-1">
                    {/* View Detail Button */}
                    <button
                      onClick={() => onViewExam(exam)}
                      onMouseEnter={() => onPrefetchExam(exam._id)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Analytics Button - Only show if status is completed */}
                    {exam.status === 'completed' && (
                      <button
                        onClick={() => onAnalyticsExam(exam)}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
                        title="Lihat Analitik"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditExam(exam)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Ujian"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteExam(exam)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus Ujian"
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
    </div>
  );
});

ExamTable.displayName = 'ExamTable';

export default ExamTable;
