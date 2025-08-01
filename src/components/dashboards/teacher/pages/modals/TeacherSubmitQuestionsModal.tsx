import React, { useState, useEffect } from 'react';
import { X, Send, Users, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService } from '@/services/questionBank';
import { subjectService } from '@/services/subject';
import { AvailableCoordinator } from '@/types/subject';
import toast from 'react-hot-toast';

interface TeacherSubmitQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedQuestionIds: string[];
  questionSource: 'my_questions' | 'submitted_questions';
}

const TeacherSubmitQuestionsModal: React.FC<TeacherSubmitQuestionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedQuestionIds,
  questionSource
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [availableCoordinators, setAvailableCoordinators] = useState<AvailableCoordinator[]>([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    const fetchCoordinators = async () => {
      if (!token || !isOpen) return;

      setLoadingCoordinators(true);
      try {
        const coordinators = await subjectService.getAvailableCoordinators(token);
        setAvailableCoordinators(coordinators);
      } catch (error) {
        console.error('Error fetching coordinators:', error);
        toast.error('Gagal memuat daftar koordinator');
      } finally {
        setLoadingCoordinators(false);
      }
    };

    if (isOpen) {
      fetchCoordinators();
      // Reset form when modal opens
      setSelectedCoordinatorId('');
      setPurpose('');
    }
  }, [isOpen, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    // Validation
    if (selectedQuestionIds.length === 0) {
      toast.error('Tidak ada soal yang dipilih');
      return;
    }

    if (!selectedCoordinatorId) {
      toast.error('Pilih koordinator tujuan');
      return;
    }

    if (!purpose.trim()) {
      toast.error('Tujuan submission harus diisi');
      return;
    }

    setLoading(true);
    try {
      await questionBankService.submitForReview(token, selectedQuestionIds, selectedCoordinatorId, purpose.trim());
      toast.success(`Berhasil submit ${selectedQuestionIds.length} soal untuk review`);
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal submit soal';
      toast.error(errorMessage);
      console.error('Error submitting questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCoordinator = availableCoordinators.find(c => c.coordination_assignment_id === selectedCoordinatorId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Submit Soal untuk Review</h2>
              <p className="text-sm text-gray-500">
                Submit {selectedQuestionIds.length} soal ke koordinator mata pelajaran
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected Questions Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Soal yang akan disubmit</h3>
                <p className="text-sm text-blue-700">
                  {selectedQuestionIds.length} soal dari {questionSource === 'my_questions' ? 'soal Anda' : 'submission'}
                </p>
              </div>
            </div>
          </div>

          {/* Coordinator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Koordinator Tujuan *
            </label>
            {loadingCoordinators ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-gray-600">Memuat koordinator...</span>
                </div>
              </div>
            ) : availableCoordinators.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Tidak ada koordinator tersedia</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tidak ditemukan koordinator yang dapat menerima submission soal Anda saat ini.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={selectedCoordinatorId}
                onChange={(e) => setSelectedCoordinatorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Pilih koordinator...</option>
                {availableCoordinators.map((coordinator) => (
                  <option key={coordinator.coordination_assignment_id} value={coordinator.coordination_assignment_id}>
                    {coordinator.coordinator_name} - {coordinator.coordinator_responsible_for}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Coordinator Details */}
          {selectedCoordinator && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Detail Koordinator</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Nama:</span>
                      <p className="font-medium text-gray-900">{selectedCoordinator.coordinator_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium text-gray-900">{selectedCoordinator.coordinator_email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Mata Pelajaran:</span>
                      <p className="font-medium text-gray-900">
                        {selectedCoordinator.subject_name} ({selectedCoordinator.subject_code})
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Kelas:</span>
                      <p className="font-medium text-gray-900">Kelas {selectedCoordinator.grade_level}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-500">Tanggung Jawab:</span>
                    <p className="font-medium text-gray-900">{selectedCoordinator.coordinator_responsible_for}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tujuan Submission *
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={4}
              placeholder="Jelaskan tujuan submission soal ini (contoh: untuk ujian tengah semester, latihan soal, dll.)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Berikan penjelasan yang jelas tentang tujuan submission soal ini
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Informasi Submission</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Soal akan dikirim ke koordinator untuk direview</li>
                  <li>• Koordinator dapat menyetujui atau menolak soal</li>
                  <li>• Anda akan mendapat notifikasi hasil review</li>
                  <li>• Soal yang disetujui akan masuk ke bank soal publik</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || availableCoordinators.length === 0}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit {selectedQuestionIds.length} Soal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherSubmitQuestionsModal;