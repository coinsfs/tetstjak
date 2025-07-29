import React, { useState } from 'react';
import { X, Play, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { teacherExamService, TeacherExam } from '@/services/teacherExam';
import toast from 'react-hot-toast';

interface TeacherExamStartConfirmationModalProps {
  exam: TeacherExam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherExamStartConfirmationModal: React.FC<TeacherExamStartConfirmationModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleStartExam = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await teacherExamService.startExamManually(token, exam._id);
      toast.success('Ujian berhasil dimulai');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memulai ujian';
      toast.error(errorMessage);
      console.error('Error starting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeLabel = (examType: string) => {
    const typeLabels: { [key: string]: string } = {
      'quiz': 'Kuis',
      'daily_test': 'Ulangan Harian (UH)',
      'official_uts': 'UTS (Ujian Tengah Semester)',
      'official_uas': 'UAS (Ujian Akhir Semester)'
    };
    return typeLabels[examType] || examType;
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

  const isConfirmationValid = confirmationText.trim() === exam.title.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Konfirmasi Mulai Ujian</h2>
              <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
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
        <div className="p-4 space-y-4">
          <div className="mb-4">
            <p className="text-gray-700 mb-4">
              Anda akan memulai ujian berikut. Setelah ujian dimulai, ujian tidak dapat dibatalkan dan siswa dapat mulai mengerjakan.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Judul Ujian:</span>
                <p className="text-sm text-gray-900 break-words font-medium">{exam.title}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Jenis Ujian:</span>
                <p className="text-sm text-gray-900">{getExamTypeLabel(exam.exam_type)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Durasi:</span>
                <p className="text-sm text-gray-900">{exam.duration_minutes} menit</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Jadwal:</span>
                <p className="text-sm text-gray-900">
                  {formatDateTime(exam.availability_start_time)} - {formatDateTime(exam.availability_end_time)}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Jumlah Soal:</span>
                <p className="text-sm text-gray-900">{exam.question_ids.length} soal</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-800 mb-1">Peringatan Penting</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Ujian yang sudah dimulai tidak dapat dibatalkan</li>
                  <li>• Siswa akan dapat mengakses ujian setelah dimulai</li>
                  <li>• Soal ujian tidak dapat diubah setelah dimulai</li>
                  <li>• Pastikan semua persiapan sudah selesai</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Untuk konfirmasi, ketik judul ujian di bawah ini:
            </label>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded border font-mono">
              {exam.title}
            </div>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
              placeholder="Ketik judul ujian untuk konfirmasi..."
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-red-600">
                Judul yang diketik tidak sesuai
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleStartExam}
            disabled={loading || !isConfirmationValid}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Memulai...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Mulai Ujian</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamStartConfirmationModal;