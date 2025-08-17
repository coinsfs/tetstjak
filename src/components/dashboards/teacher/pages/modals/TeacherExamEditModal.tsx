import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Settings, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  teacherExamService, 
  TeacherExam,
  UpdateTeacherExamRequest,
  BasicTeacher
} from '@/services/teacherExam';
import toast from 'react-hot-toast';

// Helper functions untuk format waktu WIB
const formatUTCToWIBInput = (utcDatetime: string): string => {
  if (!utcDatetime) return '';
  
  // Parse UTC datetime dan konversi ke WIB (UTC+7)
  const utcDate = new Date(utcDatetime);
  const wibDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for WIB
  
  const year = wibDate.getFullYear();
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const day = String(wibDate.getDate()).padStart(2, '0');
  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatWIBToUTC = (wibDatetime: string): string => {
  if (!wibDatetime) return '';
  
  // Parse WIB datetime dan konversi ke UTC
  const wibDate = new Date(wibDatetime);
  const utcDate = new Date(wibDate.getTime() - (7 * 60 * 60 * 1000)); // Subtract 7 hours for UTC
  
  return utcDate.toISOString();
};

interface TeacherExamEditModalProps {
  exam: TeacherExam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherExamEditModal: React.FC<TeacherExamEditModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [basicTeachers, setBasicTeachers] = useState<BasicTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  
  const [formData, setFormData] = useState<UpdateTeacherExamRequest>({
    title: exam.title,
    exam_type: exam.exam_type,
    duration_minutes: exam.duration_minutes,
    availability_start_time: formatUTCToWIBInput(exam.availability_start_time),
    availability_end_time: formatUTCToWIBInput(exam.availability_end_time),
    status: exam.status,
    settings: {
      shuffle_questions: exam.settings.shuffle_questions,
      shuffle_options: exam.settings.shuffle_options,
      show_results_after_submission: exam.settings.show_results_after_submission
    },
    proctor_ids: exam.proctor_ids || []
  });

  useEffect(() => {
    if (isOpen) {
      fetchBasicTeachers();
    }
  }, [isOpen]);

  const fetchBasicTeachers = async () => {
    if (!token) return;

    setLoadingTeachers(true);
    try {
      const teachers = await teacherExamService.getBasicTeachers(token);
      setBasicTeachers(teachers);
    } catch (error) {
      console.error('Error fetching basic teachers:', error);
      toast.error('Gagal memuat daftar guru');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleInputChange = (field: keyof UpdateTeacherExamRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (field: keyof UpdateTeacherExamRequest['settings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleProctorChange = (teacherId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      proctor_ids: checked
        ? [...prev.proctor_ids, teacherId]
        : prev.proctor_ids.filter(id => id !== teacherId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    // Validation
    if (!formData.title.trim()) {
      toast.error('Judul ujian harus diisi');
      return;
    }

    if (!formData.availability_start_time || !formData.availability_end_time) {
      toast.error('Waktu mulai dan selesai harus diisi');
      return;
    }

    if (new Date(formData.availability_start_time) >= new Date(formData.availability_end_time)) {
      toast.error('Waktu selesai harus lebih besar dari waktu mulai');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Durasi ujian harus lebih dari 0 menit');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        availability_start_time: formatWIBToUTC(formData.availability_start_time),
        availability_end_time: formatWIBToUTC(formData.availability_end_time)
      };
      
      await teacherExamService.updateTeacherExam(token, exam._id, updateData);
      toast.success('Ujian berhasil diperbarui');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui ujian';
      toast.error(errorMessage);
      console.error('Error updating exam:', error);
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

  const isOfficialExam = exam.exam_type === 'official_uts' || exam.exam_type === 'official_uas';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Ujian</h2>
              <p className="text-sm text-gray-500">Perbarui informasi ujian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Official Exam Warning */}
          {isOfficialExam && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    Ujian Resmi
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Ini adalah ujian resmi ({getExamTypeLabel(exam.exam_type)}). 
                    Jenis ujian tidak dapat diubah untuk ujian resmi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Dasar
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Ujian *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  placeholder="Masukkan judul ujian"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Ujian *
                </label>
                <select
                  value={formData.exam_type}
                  onChange={(e) => handleInputChange('exam_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isOfficialExam}
                  required
                >
                  <option value="quiz">Kuis</option>
                  <option value="daily_test">Ulangan Harian (UH)</option>
                  <option value="official_uts">UTS (Ujian Tengah Semester)</option>
                  <option value="official_uas">UAS (Ujian Akhir Semester)</option>
                </select>
                {isOfficialExam && (
                  <p className="text-xs text-gray-500 mt-1">
                    Jenis ujian tidak dapat diubah untuk ujian resmi
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi (menit) *
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Jadwal Ujian
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Mulai *
                </label>
                <input
                  type="datetime-local"
                  value={formData.availability_start_time}
                  onChange={(e) => handleInputChange('availability_start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">Waktu dalam zona WIB (UTC+7)</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Selesai *
                </label>
                <input
                  type="datetime-local"
                  value={formData.availability_end_time}
                  onChange={(e) => handleInputChange('availability_end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">Waktu dalam zona WIB (UTC+7)</div>
              </div>
            </div>
          </div>

          {/* Proctors */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Pengawas Ujian
            </h3>
            
            {loadingTeachers ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                <span className="text-sm text-gray-600">Memuat daftar guru...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {basicTeachers.map((teacher) => (
                  <label key={teacher._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.proctor_ids.includes(teacher._id)}
                      onChange={(e) => handleProctorChange(teacher._id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{teacher.full_name}</span>
                  </label>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Pilih guru yang akan menjadi pengawas ujian. Anda dapat memilih lebih dari satu pengawas.
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Pengaturan Ujian
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900">Acak Urutan Soal</label>
                  <p className="text-xs text-gray-500">Soal akan ditampilkan dalam urutan acak untuk setiap siswa</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.shuffle_questions}
                  onChange={(e) => handleSettingsChange('shuffle_questions', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900">Acak Pilihan Jawaban</label>
                  <p className="text-xs text-gray-500">Pilihan jawaban akan ditampilkan dalam urutan acak</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.shuffle_options}
                  onChange={(e) => handleSettingsChange('shuffle_options', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900">Tampilkan Hasil Langsung</label>
                  <p className="text-xs text-gray-500">Siswa dapat melihat hasil ujian setelah selesai mengerjakan</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.show_results_after_submission}
                  onChange={(e) => handleSettingsChange('show_results_after_submission', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
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
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Perbarui Ujian</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherExamEditModal;