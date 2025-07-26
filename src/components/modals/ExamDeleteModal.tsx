import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Exam } from '@/types/exam';
import { examService } from '@/services/exam';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExamDeleteModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ExamDeleteModal: React.FC<ExamDeleteModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await examService.deleteExam(token, exam._id);
      toast.success('Ujian berhasil dihapus');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus ujian';
      toast.error(errorMessage);
      console.error('Error deleting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h2>
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
              Apakah Anda yakin ingin menghapus ujian berikut?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Judul Ujian:</span>
                <p className="text-sm text-gray-900">{exam.title}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Mata Pelajaran:</span>
                <p className="text-sm text-gray-900">
                  {exam.teaching_assignment_details.subject_details.name}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Kelas:</span>
                <p className="text-sm text-gray-900">
                  {exam.teaching_assignment_details.class_details.grade_level} {exam.teaching_assignment_details.class_details.name}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Jadwal:</span>
                <p className="text-sm text-gray-900">
                  {formatDateTime(exam.availability_start_time)} - {formatDateTime(exam.availability_end_time)}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <p className="text-sm text-gray-900">{exam.status}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Jumlah Soal:</span>
                <p className="text-sm text-gray-900">{exam.questions?.length || 0} soal</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Saran</h4>
                <p className="text-sm text-blue-700">
                  <strong>Unduh laporan hasil ujian</strong> terlebih dahulu jika diperlukan untuk arsip. 
                  Setelah dihapus, semua data ujian tidak dapat dipulihkan kembali.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Dampak Penghapusan</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Semua soal ujian akan hilang</li>
                  <li>• Jawaban dan hasil siswa akan terhapus</li>
                  <li>• Riwayat nilai ujian akan hilang</li>
                  <li>• Data analisis ujian akan terhapus</li>
                  <li>• <strong>Tindakan ini tidak dapat dibatalkan</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Ujian</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDeleteModal;