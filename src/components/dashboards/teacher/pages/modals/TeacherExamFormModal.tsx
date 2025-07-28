import React, { useState } from 'react';
import { X, FileText, Calendar, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  teacherExamService, 
  CreateTeacherExamRequest,
} from '@/services/teacherExam';
import { TeachingClass } from '@/services/teacher';
import toast from 'react-hot-toast';

interface TeacherExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachingClasses: TeachingClass[];
  currentUserId: string;
}

const TeacherExamFormModal: React.FC<TeacherExamFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teachingClasses,
  currentUserId
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTeacherExamRequest>({
    title: '',
    exam_type: 'quiz',
    duration_minutes: 60,
    availability_start_time: '',
    availability_end_time: '',
    status: 'pending_questions',
    settings: {
      shuffle_questions: true,
      shuffle_options: true,
      show_results_after_submission: false
    },
    academic_period_id: '',
    teaching_assignment_id: '',
    question_ids: [],
    proctor_ids: [currentUserId] // Default centang user ini sendiri
  });
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const handleInputChange = (field: keyof CreateTeacherExamRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    // Reset teaching assignment when class changes
    setFormData(prev => ({
      ...prev,
      teaching_assignment_id: ''
    }));
  };
  const handleSettingsChange = (field: keyof CreateTeacherExamRequest['settings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
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

    if (!formData.teaching_assignment_id) {
      toast.error('Pilih mata pelajaran');
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

    if (!selectedClassId) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      await teacherExamService.createTeacherExam(token, formData);
      toast.success('Ujian berhasil dibuat');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuat ujian';
      toast.error(errorMessage);
      console.error('Error creating exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedClass = () => {
    return teachingClasses.find(tc => tc.class_details._id === selectedClassId);
  };

  const getAvailableSubjects = () => {
    const selectedClass = getSelectedClass();
    return selectedClass ? selectedClass.assignments : [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Buat Ujian Baru</h2>
              <p className="text-sm text-gray-500">Buat ujian untuk kelas yang Anda ajar</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informasi Dasar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Ujian *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                >
                  <option value="quiz">Kuis</option>
                  <option value="daily_test">Ulangan Harian (UH)</option>
                  <option value="official_uts">UTS (Ujian Tengah Semester)</option>
                  <option value="official_uas">UAS (Ujian Akhir Semester)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi (menit) *
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                >
                  <option value="">Pilih kelas</option>
                  {teachingClasses.map((teachingClass) => (
                    <option key={teachingClass.class_details._id} value={teachingClass.class_details._id}>
                      Kelas {teachingClass.class_details.grade_level} {teachingClass.expertise_details.abbreviation} {teachingClass.class_details.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran *
                </label>
                <select
                  value={formData.teaching_assignment_id}
                  onChange={(e) => handleInputChange('teaching_assignment_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={!selectedClassId}
                  required
                >
                  <option value="">Pilih mata pelajaran</option>
                  {getAvailableSubjects().map((assignment) => (
                    <option key={assignment.teaching_assignment_id} value={assignment.teaching_assignment_id}>
                      {assignment.name} ({assignment.code})
                    </option>
                  ))}
                </select>
                {!selectedClassId && (
                  <p className="text-xs text-gray-500 mt-1">Pilih kelas terlebih dahulu</p>
                )}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Jadwal Ujian
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Mulai *
                </label>
                <input
                  type="datetime-local"
                  value={formData.availability_start_time}
                  onChange={(e) => handleInputChange('availability_start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Selesai *
                </label>
                <input
                  type="datetime-local"
                  value={formData.availability_end_time}
                  onChange={(e) => handleInputChange('availability_end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Informasi</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ujian akan dibuat dengan status "Menunggu Soal"</li>
                  <li>• Anda akan menjadi pengawas default untuk ujian ini</li>
                  <li>• Setelah ujian dibuat, Anda dapat menambahkan soal-soal ujian</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Membuat...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Buat Ujian</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamFormModal;