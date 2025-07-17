import React, { memo } from 'react';
import { Edit, Trash2, FileText, Calendar, Clock, User, BarChart3 } from 'lucide-react';
import { Exam, EXAM_STATUS } from '../types/exam';

interface ExamTableProps {
  exams: Exam[];
  loading: boolean;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (exam: Exam) => void;
  onAnalyticsExam: (exam: Exam) => void;
}

const ExamTable: React.FC<ExamTableProps> = memo(({
  exams,
  loading,
  onEditExam,
  onDeleteExam,
  onAnalyticsExam
}) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    const typeLabels: { [key: string]: string } = {
      'official_uts': 'UTS',
      'official_uas': 'UAS',
      'quiz': 'Kuis',
      'assignment': 'Tugas',
      'practice': 'Latihan'
    };
    return typeLabels[examType] || examType;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-700">Memuat data ujian...</span>
          </div>
        </div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data ujian</h3>
          <p className="text-gray-500">
            Belum ada ujian yang terdaftar atau sesuai dengan pencarian yang dilakukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ujian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mata Pelajaran & Kelas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jadwal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pengawas
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => (
              <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                {/* Exam Info */}
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {exam.title}
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {getExamTypeLabel(exam.exam_type)}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {exam.duration_minutes} menit
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {exam.academic_period_details.year} - Semester {exam.academic_period_details.semester}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Subject & Class */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {exam.teaching_assignment_details.subject_details.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Kelas {exam.teaching_assignment_details.class_details.grade_level} {exam.teaching_assignment_details.class_details.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {exam.teaching_assignment_details.class_details.academic_year}
                    </div>
                  </div>
                </td>

                {/* Schedule */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="font-medium">Mulai</div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(exam.availability_start_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="font-medium">Selesai</div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(exam.availability_end_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {getStatusBadge(exam.status)}
                    <div className="text-xs text-gray-500">
                      Guru: {exam.teaching_assignment_details.teacher_details.login_id}
                    </div>
                  </div>
                </td>

                {/* Proctors */}
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-2" />
                    {exam.proctor_ids.length > 0 ? (
                      <span>{exam.proctor_ids.length} pengawas</span>
                    ) : (
                      <span className="text-gray-400">Belum ada pengawas</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
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