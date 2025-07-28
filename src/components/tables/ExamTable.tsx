import React, { memo } from 'react';
import { Eye, Edit, Trash2, FileText, Calendar, Clock, User, Users, BookOpen } from 'lucide-react';
import { Exam } from '@/types/exam';

interface ExamTableProps {
  exams: Exam[];
  loading: boolean;
  onViewExam: (exam: Exam) => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (exam: Exam) => void;
}

const ExamTable: React.FC<ExamTableProps> = memo(({
  exams,
  loading,
  onViewExam,
  onEditExam,
  onDeleteExam
}) => {
  const getExamTypeLabel = (examType: string) => {
    const typeLabels: { [key: string]: string } = {
      'official_uts': 'UTS (Ujian Tengah Semester)',
      'official_uas': 'UAS (Ujian Akhir Semester)',
      'quiz': 'Kuis',
      'daily_test': 'Ulangan Harian'
    };
    return typeLabels[examType] || examType;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      'pending_questions': { label: 'Menunggu Soal', color: 'bg-yellow-100 text-yellow-800' },
      'ready': { label: 'Siap', color: 'bg-blue-100 text-blue-800' },
      'active': { label: 'Aktif', color: 'bg-green-100 text-green-800' },
      'completed': { label: 'Selesai', color: 'bg-purple-100 text-purple-800' },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
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

  const isDeleteDisabled = (exam: Exam) => {
    return exam.exam_type === 'official_uts' || exam.exam_type === 'official_uas';
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data ujian</h3>
          <p className="text-gray-500">
            {loading ? 'Memuat data ujian...' : 'Belum ada ujian yang terdaftar atau sesuai dengan filter yang dipilih.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="exam-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="exam-col-title text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ujian
              </th>
              <th className="exam-col-type text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jenis
              </th>
              <th className="exam-col-status text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="exam-col-schedule text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jadwal
              </th>
              <th className="exam-col-duration text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durasi
              </th>
              <th className="exam-col-subject text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mata Pelajaran
              </th>
              <th className="exam-col-class text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kelas
              </th>
              <th className="exam-col-teacher text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guru
              </th>
              <th className="exam-col-actions text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => (
              <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                {/* Ujian */}
                <td className="exam-col-title" title={exam.title}>
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1 break-words">
                        {exam.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {exam._id.slice(-8)}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Jenis */}
                <td className="exam-col-type">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getExamTypeLabel(exam.exam_type)}
                  </span>
                </td>

                {/* Status */}
                <td className="exam-col-status">
                  {getStatusBadge(exam.status)}
                </td>

                {/* Jadwal */}
                <td className="exam-col-schedule">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="break-words">Mulai: {formatDateTime(exam.availability_start_time)}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="break-words">Selesai: {formatDateTime(exam.availability_end_time)}</span>
                    </div>
                  </div>
                </td>

                {/* Durasi */}
                <td className="exam-col-duration">
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{exam.duration_minutes} menit</span>
                  </div>
                </td>

                {/* Mata Pelajaran */}
                <td className="exam-col-subject" title={exam.teaching_assignment_details.subject_details.name}>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 break-words">
                        {exam.teaching_assignment_details.subject_details.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {exam.teaching_assignment_details.subject_details.code}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Kelas */}
                <td className="exam-col-class">
                  <div className="text-sm text-gray-900 break-words">
                    Kelas {exam.teaching_assignment_details.class_details.grade_level} {exam.teaching_assignment_details.class_details.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {exam.teaching_assignment_details.class_details.academic_year}
                  </div>
                </td>

                {/* Guru */}
                <td className="exam-col-teacher" title={exam.teaching_assignment_details.teacher_details.login_id}>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 break-words">
                        {exam.teaching_assignment_details.teacher_details.login_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pengawas: {exam.proctor_ids.length}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="exam-col-actions">
                  <div className="flex items-center justify-center space-x-1">
                    {/* View Detail Button */}
                    <button
                      onClick={() => onViewExam(exam)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

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
                      disabled={isDeleteDisabled(exam)}
                      className={`p-2 rounded-md transition-colors ${
                        isDeleteDisabled(exam)
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                      }`}
                      title={isDeleteDisabled(exam) ? 'Ujian resmi tidak dapat dihapus' : 'Hapus Ujian'}
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