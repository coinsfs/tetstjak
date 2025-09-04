import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { teacherExamService, TeacherExam } from '@/services/teacherExam';
import toast from 'react-hot-toast';

interface TeacherExamFinishConfirmationModalProps {
  exam: TeacherExam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherExamFinishConfirmationModal: React.FC<TeacherExamFinishConfirmationModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');

  const handleFinishExam = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await teacherExamService.finishExamManually(token, exam._id, reason);
      toast.success('Ujian berhasil diselesaikan');
      onClose();
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyelesaikan ujian';
      toast.error(errorMessage);
      console.error('Error finishing exam:', error);
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
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const isConfirmationValid = confirmationText.toLowerCase() === 'selesai';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Penyelesaian Ujian</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Peringatan Penting</h4>
              <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-gray-900 mb-2">Detail Ujian:</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Judul:</span>
                <span className="text-gray-900">{exam.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jenis:</span>
                <span className="text-gray-900">{getExamTypeLabel(exam.exam_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durasi:</span>
                <span className="text-gray-900">{exam.duration_minutes} menit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status Saat Ini:</span>
                <span className="text-orange-600 font-medium">Sedang Berlangsung</span>
              </div>
            </div>
          </div>

          

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan menyelesaikan ujian (opsional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Masukkan alasan mengapa ujian diselesaikan lebih awal..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ketik <span className="font-bold text-red-600">"selesai"</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Ketik: selesai"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleFinishExam}
            disabled={!isConfirmationValid || loading}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              isConfirmationValid && !loading
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyelesaikan...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Selesaikan Ujian
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamFinishConfirmationModal;