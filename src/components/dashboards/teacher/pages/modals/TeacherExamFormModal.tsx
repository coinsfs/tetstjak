import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Settings, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService } from '@/services/assignment';
import { TeachingAssignment } from '@/types/assignment';
import { 
  teacherExamService, 
  TeacherExam, 
  CreateTeacherExamRequest, 
  UpdateTeacherExamRequest,
  BasicTeacher,
  AcademicPeriod,
  ActiveAcademicPeriod
} from '@/services/teacherExam';
import { TeachingClass } from '@/services/teacher';
import toast from 'react-hot-toast';

interface TeacherExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  exam?: TeacherExam;
}

const TeacherExamFormModal: React.FC<TeacherExamFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  exam
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProctors, setLoadingProctors] = useState(false);
  const [availableProctors, setAvailableProctors] = useState<BasicTeacher[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [allTeachingAssignments, setAllTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const isEdit = !!exam;

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
    proctor_ids: []
  });

  // Load initial data when modal opens
  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;
      
      try {
        const [periodsData, proctorsData, activeData, assignmentsData] = await Promise.all([
          teacherExamService.getAcademicPeriods(token),
          teacherExamService.getBasicTeachers(token),
          teacherExamService.getActiveAcademicPeriod(token),
          assignmentService.getTeachingAssignments(token)
        ]);
        
        setAcademicPeriods(periodsData);
        setAvailableProctors(proctorsData);
        setAllTeachingAssignments(assignmentsData);
        
        // Set active academic period as default if not editing
        if (!isEdit && activeData) {
          setFormData(prev => ({
            ...prev,
            academic_period_id: activeData._id
          }));
        }
        
        // If editing, populate form with exam data
        if (isEdit && exam) {
          setFormData({
            title: exam.title,
            exam_type: exam.exam_type as any,
            duration_minutes: exam.duration_minutes,
            availability_start_time: exam.availability_start_time,
            availability_end_time: exam.availability_end_time,
            status: exam.status as any,
            settings: exam.settings || {
              shuffle_questions: true,
              shuffle_options: true,
              show_results_after_submission: false
            },
            academic_period_id: exam.academic_period_id,
            teaching_assignment_id: exam.teaching_assignment_id,
            question_ids: exam.question_ids || [],
            proctor_ids: exam.proctor_ids || []
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Gagal memuat data');
      }
    };

    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, token, isEdit, exam]);

  // Load proctors when academic period changes
  const loadProctorsForPeriod = async (academicPeriodId: string) => {
    if (!token || !academicPeriodId) return;
    
    setLoadingProctors(true);
    try {
      const proctors = await teacherExamService.getBasicTeachers(token);
      setAvailableProctors(proctors);
    } catch (error) {
      console.error('Error loading proctors:', error);
      setAvailableProctors([]);
    } finally {
      setLoadingProctors(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingField = field.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Load proctors when academic period changes
    if (field === 'academic_period_id') {
      loadProctorsForPeriod(value);
    }
  };

  const handleProctorToggle = (proctorId: string) => {
    const currentProctors = formData.proctor_ids || [];
    const newProctors = currentProctors.includes(proctorId)
      ? currentProctors.filter(id => id !== proctorId)
      : [...currentProctors, proctorId];
    
    handleInputChange('proctor_ids', newProctors);
  };

  // Get available subjects based on teaching assignments and academic period
  const getAvailableSubjects = () => {
    if (!formData.academic_period_id || !allTeachingAssignments) {
      return [];
    }
    
    // Filter teaching assignments by academic period
    const relevantAssignments = allTeachingAssignments.filter(assignment => {
      // You might need to adjust this logic based on how academic periods
      // are linked to teaching assignments in your data structure
      return assignment.class_details?.academic_year === formData.academic_period_id ||
             assignment._id; // Fallback - include all if no specific filtering
    });

    return relevantAssignments;
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Judul ujian harus diisi');
      return false;
    }

    if (!formData.academic_period_id) {
      toast.error('Pilih periode akademik');
      return false;
    }

    if (!formData.teaching_assignment_id) {
      toast.error('Pilih mata pelajaran');
      return false;
    }

    if (!formData.availability_start_time || !formData.availability_end_time) {
      toast.error('Waktu mulai dan selesai harus diisi');
      return false;
    }

    const startTime = new Date(formData.availability_start_time);
    const endTime = new Date(formData.availability_end_time);
    
    if (endTime <= startTime) {
      toast.error('Waktu selesai harus setelah waktu mulai');
      return false;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Durasi ujian harus lebih dari 0 menit');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !validateForm()) return;

    setLoading(true);
    try {
      if (isEdit && exam) {
        const updateData: UpdateTeacherExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: formData.availability_start_time,
          availability_end_time: formData.availability_end_time,
          status: formData.status,
          settings: formData.settings,
          proctor_ids: formData.proctor_ids
        };

        await teacherExamService.updateTeacherExam(token, exam._id, updateData);
        toast.success('Ujian berhasil diperbarui');
      } else {
        await teacherExamService.createTeacherExam(token, formData);
        toast.success('Ujian berhasil dibuat');
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Gagal ${isEdit ? 'memperbarui' : 'membuat'} ujian`;
      toast.error(errorMessage);
      console.error('Error submitting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Ujian' : 'Buat Ujian Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Perbarui informasi ujian' : 'Buat ujian untuk kelas yang Anda ajar'}
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
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    <option value="daily_test">Ulangan Harian</option>
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
                    Periode Akademik *
                  </label>
                  <select
                    value={formData.academic_period_id}
                    onChange={(e) => handleInputChange('academic_period_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    disabled={isEdit}
                    required
                  >
                    <option value="">Pilih periode akademik</option>
                    {academicPeriods.map((period) => (
                      <option key={period._id} value={period._id}>
                        {period.year} - Semester {period.semester}
                        {period.is_active && ' (Aktif)'}
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
                    disabled={isEdit || !formData.academic_period_id}
                    required
                  >
                    <option value="">Pilih mata pelajaran</option>
                    {getAvailableSubjects().map((assignment) => (
                      <option key={assignment._id} value={assignment._id}>
                        {assignment.subject_details.name} - Kelas {assignment.class_details.grade_level} {assignment.class_details.expertise_details.abbreviation} {assignment.class_details.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
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

            {/* Proctors */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Pengawas Ujian
              </h3>
              
              <div className="space-y-2">
                {loadingProctors ? (
                  <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                    Memuat data pengawas...
                  </div>
                ) : availableProctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableProctors.map((proctor) => (
                      <label key={proctor._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.proctor_ids?.includes(proctor._id) || false}
                          onChange={() => handleProctorToggle(proctor._id)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{proctor.name}</div>
                          <div className="text-xs text-gray-500">{proctor.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                    {formData.academic_period_id ? 'Tidak ada pengawas tersedia' : 'Pilih periode akademik terlebih dahulu'}
                  </div>
                )}
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
                    onChange={(e) => handleInputChange('settings.shuffle_questions', e.target.checked)}
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
                    onChange={(e) => handleInputChange('settings.shuffle_options', e.target.checked)}
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
                    onChange={(e) => handleInputChange('settings.show_results_after_submission', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEdit ? 'Memperbarui...' : 'Membuat...'}</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>{isEdit ? 'Perbarui Ujian' : 'Buat Ujian'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamFormModal;