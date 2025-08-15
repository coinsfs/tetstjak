import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Settings, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TeachingClass } from '@/services/teacher';
import { teacherExamService, CreateTeacherExamRequest, UpdateTeacherExamRequest, TeacherExam, BasicTeacher, AcademicPeriod } from '@/services/teacherExam';
import { teacherService, TeachingSummaryResponse } from '@/services/teacher';
import { convertWIBToUTC, convertUTCToWIB, getCurrentWIBDateTime, validateTimeRange } from '@/utils/timezone';
import toast from 'react-hot-toast';

interface TeacherExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachingClasses: TeachingClass[];
  currentUserId: string;
  activeAcademicPeriod: {
    _id: string;
  } | null;
  examId?: string;
}

const TeacherExamFormModal: React.FC<TeacherExamFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teachingClasses,
  currentUserId,
  activeAcademicPeriod,
  examId
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [teachingSummary, setTeachingSummary] = useState<TeachingSummaryResponse | null>(null);
  const [availableProctors, setAvailableProctors] = useState<BasicTeacher[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  
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

  const isEditMode = !!examId;

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, examId]);

  const loadInitialData = async () => {
    if (!token) return;

    setInitialLoading(true);
    try {
      // Load teaching summary and academic periods in parallel
      const [summaryResponse, periodsResponse] = await Promise.all([
        teacherService.getTeachingSummary(token),
        teacherExamService.getAcademicPeriods(token)
      ]);

      setTeachingSummary(summaryResponse);
      setAcademicPeriods(periodsResponse);

      // Set default academic period to active one
      const activePeriod = periodsResponse.find(p => p.is_active);
      if (!isEditMode) {
        let defaultPeriodId = '';
        if (activePeriod) {
          defaultPeriodId = activePeriod._id;
        } else if (activeAcademicPeriod) {
          defaultPeriodId = activeAcademicPeriod._id;
        }
        
        setFormData(prev => ({
          ...prev,
          academic_period_id: defaultPeriodId
        }));
      }

      // If editing, load exam data
      if (isEditMode) {
        const examData = await teacherExamService.getTeacherExamById(token, examId);
        populateFormData(examData);
        
        // Load available proctors for the exam's academic period
        const proctors = await teacherExamService.getBasicTeachers(token);
        setAvailableProctors(proctors);
      } else {
        // For new exam, reset form with current time
        resetForm();
        
        // Load proctors for active period if available
        if (activePeriod) {
          const proctors = await teacherExamService.getBasicTeachers(token);
          setAvailableProctors(proctors);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setInitialLoading(false);
    }
  };

  const populateFormData = (examData: TeacherExam) => {
    setFormData({
      title: examData.title,
      exam_type: examData.exam_type as any,
      duration_minutes: examData.duration_minutes,
      availability_start_time: convertUTCToWIB(examData.availability_start_time),
      availability_end_time: convertUTCToWIB(examData.availability_end_time),
      status: examData.status as any,
      academic_period_id: examData.academic_period_id,
      teaching_assignment_id: examData.teaching_assignment_id,
      question_ids: examData.question_ids || [],
      proctor_ids: examData.proctor_ids || [],
      settings: {
        shuffle_questions: examData.settings?.shuffle_questions ?? true,
        shuffle_options: examData.settings?.shuffle_options ?? true,
        show_results_after_submission: examData.settings?.show_results_after_submission ?? false
      }
    });
  };

  const resetForm = () => {
    const now = getCurrentWIBDateTime();
    const nowDate = new Date(now);
    const oneHourLater = new Date(nowDate.getTime() + 60 * 60 * 1000);
    const oneHourLaterFormatted = convertUTCToWIB(oneHourLater.toISOString());

    setFormData({
      title: '',
      exam_type: 'quiz',
      duration_minutes: 60,
      availability_start_time: now,
      availability_end_time: oneHourLaterFormatted,
      status: 'pending_questions',
      academic_period_id: academicPeriods.find(p => p.is_active)?._id || '',
      teaching_assignment_id: '',
      question_ids: [],
      proctor_ids: [],
      settings: {
        shuffle_questions: true,
        shuffle_options: true,
        show_results_after_submission: false
      }
    });
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
  };

  const handleAcademicPeriodChange = async (periodId: string) => {
    handleInputChange('academic_period_id', periodId);
    
    // Reset teaching assignment when academic period changes
    handleInputChange('teaching_assignment_id', '');
    
    // Load available proctors for the selected period
    if (periodId && token) {
      try {
        const proctors = await teacherExamService.getBasicTeachers(token);
        setAvailableProctors(proctors);
      } catch (error) {
        console.error('Error loading proctors:', error);
        setAvailableProctors([]);
      }
    } else {
      setAvailableProctors([]);
    }
  };

  const handleProctorToggle = (proctorId: string) => {
    const currentProctors = formData.proctor_ids || [];
    const newProctors = currentProctors.includes(proctorId)
      ? currentProctors.filter(id => id !== proctorId)
      : [...currentProctors, proctorId];
    
    handleInputChange('proctor_ids', newProctors);
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

    if (!validateTimeRange(formData.availability_start_time, formData.availability_end_time)) {
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
      if (isEditMode) {
        const updateData: UpdateTeacherExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: convertWIBToUTC(formData.availability_start_time),
          availability_end_time: convertWIBToUTC(formData.availability_end_time),
          status: formData.status,
          settings: formData.settings,
          proctor_ids: formData.proctor_ids
        };

        await teacherExamService.updateTeacherExam(token, examId, updateData);
        toast.success('Ujian berhasil diperbarui');
      } else {
        const createData: CreateTeacherExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: convertWIBToUTC(formData.availability_start_time),
          availability_end_time: convertWIBToUTC(formData.availability_end_time),
          status: formData.status,
          settings: formData.settings,
          academic_period_id: formData.academic_period_id,
          teaching_assignment_id: formData.teaching_assignment_id,
          question_ids: formData.question_ids,
          proctor_ids: formData.proctor_ids
        };

        await teacherExamService.createTeacherExam(token, createData);
        toast.success('Ujian berhasil dibuat');
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Gagal ${isEditMode ? 'memperbarui' : 'membuat'} ujian`;
      toast.error(errorMessage);
      console.error('Error submitting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTeachingAssignments = () => {
    if (!teachingSummary || !teachingSummary.teaching_assignments || !formData.academic_period_id) {
      // Fallback to teachingClasses if teaching_assignments is empty
      if (!teachingClasses || teachingClasses.length === 0 || !formData.academic_period_id) return [];
      
      // Extract assignments from teachingClasses with safe property access
      const allAssignments = teachingClasses.flatMap(teachingClass => 
        (teachingClass.assignments || []).map(assignment => ({
          ...assignment,
          _id: assignment.teaching_assignment_id,
          class_details: {
            ...teachingClass.class_details,
            expertise_details: teachingClass.expertise_details || {}
          },
          subject_details: { 
            name: assignment.name || 'Unknown Subject', 
            code: assignment.code || 'N/A' 
          },
          academic_period_id: formData.academic_period_id // Assume current period
        }))
      );
      return allAssignments;
    }
    
    return teachingSummary.teaching_assignments.filter(
      assignment => assignment.academic_period_id === formData.academic_period_id
    );
  };

  // Helper function to safely get class display text
  const getClassDisplayText = (assignment: any) => {
    const classDetails = assignment.class_details || {};
    const expertiseDetails = classDetails.expertise_details || {};
    
    const gradeLevel = classDetails.grade_level || 'N/A';
    const abbreviation = expertiseDetails.abbreviation || 'N/A';
    const className = classDetails.name || 'N/A';
    
    return `Kelas ${gradeLevel} ${abbreviation} ${className}`;
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
                {isEditMode ? 'Edit Ujian' : 'Buat Ujian Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditMode ? 'Perbarui informasi ujian' : 'Buat ujian untuk kelas yang Anda ajar'}
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
          {initialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : (
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
                      onChange={(e) => handleAcademicPeriodChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      disabled={isEditMode}
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
                      disabled={isEditMode || !formData.academic_period_id}
                      required
                    >
                      <option value="">Pilih mata pelajaran</option>
                      {getAvailableTeachingAssignments().map((assignment) => (
                        <option key={assignment._id || assignment.teaching_assignment_id} value={assignment._id || assignment.teaching_assignment_id}>
                          {assignment.subject_details?.name || 'Unknown Subject'} - {getClassDisplayText(assignment)}
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
                    <div className="text-xs text-gray-500 mb-1">Waktu dalam zona WIB (UTC+7)</div>
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
                    <div className="text-xs text-gray-500 mb-1">Waktu dalam zona WIB (UTC+7)</div>
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
                  {availableProctors.length > 0 ? (
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
                            <div className="text-sm font-medium text-gray-900">{proctor.full_name}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                      {formData.academic_period_id ? 'Tidak ada pengawas tersedia untuk periode akademik ini' : 'Pilih periode akademik terlebih dahulu'}
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isEditMode ? 'Memperbarui...' : 'Membuat...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditMode ? 'Perbarui Ujian' : 'Buat Ujian'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherExamFormModal;