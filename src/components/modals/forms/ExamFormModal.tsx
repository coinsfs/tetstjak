import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Settings, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { examService } from '@/services/exam';
import { 
  Exam, 
  CreateExamRequest, 
  UpdateExamRequest,
  ExamSubject,
  ExamClassData,
  AcademicPeriod,
  EXAM_TYPES,
  EXAM_STATUS
} from '@/types/exam';
import { ExpertiseProgram } from '@/types/common';
import { Teacher } from '@/types/user';
import toast from 'react-hot-toast';

interface ExamFormModalProps {
  exam?: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ExamFormModal: React.FC<ExamFormModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    exam_type: '',
    duration_minutes: 60,
    availability_start_time: '',
    availability_end_time: '',
    status: 'draft',
    proctor_ids: [] as string[],
    settings: {
      shuffle_questions: true,
      shuffle_options: true,
      show_results_after_submission: false
    },
    // Only for create mode
    target_criteria: {
      subject_id: '',
      grade_level: undefined as number | undefined,
      expertise_id: '',
      class_id: ''
    }
  });

  // Options data
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [classes, setClasses] = useState<ExamClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);

  const isEditMode = !!exam;

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (exam) {
        populateFormData(exam);
      } else {
        resetForm();
      }
    }
  }, [isOpen, exam]);

  const fetchOptions = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [subjectsData, expertiseData, classesData, teachersData, periodsData] = await Promise.all([
        examService.getSubjects(token),
        examService.getExpertisePrograms(token),
        examService.getClasses(token),
        examService.getTeachers(token),
        examService.getAcademicPeriods(token)
      ]);

      setSubjects(subjectsData);
      setExpertisePrograms(expertiseData);
      setClasses(classesData);
      setTeachers(teachersData.data || []);
      setAcademicPeriods(periodsData);
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load form options');
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (examData: Exam) => {
    const startTime = new Date(examData.availability_start_time);
    const endTime = new Date(examData.availability_end_time);

    setFormData({
      title: examData.title,
      exam_type: examData.exam_type,
      duration_minutes: examData.duration_minutes,
      availability_start_time: formatDateTimeLocal(startTime),
      availability_end_time: formatDateTimeLocal(endTime),
      status: examData.status,
      proctor_ids: examData.proctor_ids || [],
      settings: {
        shuffle_questions: examData.settings?.shuffle_questions || false,
        shuffle_options: examData.settings?.shuffle_options || false,
        show_results_after_submission: examData.settings?.show_results_after_submission || true
      },
      target_criteria: {
        subject_id: '',
        grade_level: undefined,
        expertise_id: '',
        class_id: ''
      }
    });
  };

  const resetForm = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setFormData({
      title: '',
      exam_type: '',
      duration_minutes: 60,
      availability_start_time: formatDateTimeLocal(now),
      availability_end_time: formatDateTimeLocal(oneHourLater),
      status: 'draft',
      proctor_ids: [],
      settings: {
        shuffle_questions: false,
        shuffle_options: false,
        show_results_after_submission: true
      },
      target_criteria: {
        subject_id: '',
        grade_level: undefined,
        expertise_id: '',
        class_id: ''
      }
    });
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    } else if (field.startsWith('target_criteria.')) {
      const criteriaField = field.replace('target_criteria.', '');
      setFormData(prev => ({
        ...prev,
        target_criteria: {
          ...prev.target_criteria,
          [criteriaField]: value === '' ? undefined : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleProctorChange = (proctorId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      proctor_ids: checked
        ? [...prev.proctor_ids, proctorId]
        : prev.proctor_ids.filter(id => id !== proctorId)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Judul ujian harus diisi');
      return false;
    }

    if (!formData.exam_type) {
      toast.error('Jenis ujian harus dipilih');
      return false;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Durasi ujian harus lebih dari 0 menit');
      return false;
    }

    if (!formData.availability_start_time) {
      toast.error('Waktu mulai harus diisi');
      return false;
    }

    if (!formData.availability_end_time) {
      toast.error('Waktu selesai harus diisi');
      return false;
    }

    const startTime = new Date(formData.availability_start_time);
    const endTime = new Date(formData.availability_end_time);

    if (endTime <= startTime) {
      toast.error('Waktu selesai harus setelah waktu mulai');
      return false;
    }

    // Validate target criteria only for create mode
    if (!isEditMode) {
      if (!formData.target_criteria.subject_id) {
        toast.error('Mata pelajaran harus dipilih');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) return;

    try {
      setSaving(true);

      if (isEditMode && exam) {
        // Edit mode - use UpdateExamRequest format
        const updateData: UpdateExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: formData.availability_start_time,
          availability_end_time: formData.availability_end_time,
          status: formData.status,
          proctor_ids: formData.proctor_ids,
          settings: formData.settings
        };

        await examService.updateExam(token, exam._id, updateData);
        toast.success('Ujian berhasil diperbarui');
      } else {
        // Create mode - use CreateExamRequest format
        const createData: CreateExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: formData.availability_start_time,
          availability_end_time: formData.availability_end_time,
          settings: formData.settings,
          target_criteria: formData.target_criteria,
          proctor_ids: formData.proctor_ids
        };

        await examService.createExam(token, createData);
        toast.success('Ujian berhasil dibuat');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error(`Error saving exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredClasses = classes.filter(cls => {
    if (formData.target_criteria.grade_level && cls.grade_level !== formData.target_criteria.grade_level) {
      return false;
    }
    if (formData.target_criteria.expertise_id && cls.expertise_id !== formData.target_criteria.expertise_id) {
      return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Ujian' : 'Tambah Ujian Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading form data...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Informasi Dasar
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judul Ujian *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Pilih jenis ujian</option>
                      {EXAM_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durasi (menit) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration_minutes}
                      onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waktu Mulai *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availability_start_time}
                      onChange={(e) => handleInputChange('availability_start_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {EXAM_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Target Participants - Only show in create mode */}
              {!isEditMode && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Target Peserta
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mata Pelajaran *
                      </label>
                      <select
                        value={formData.target_criteria.subject_id}
                        onChange={(e) => handleInputChange('target_criteria.subject_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Pilih mata pelajaran</option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {subject.code} - {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tingkat Kelas
                      </label>
                      <select
                        value={formData.target_criteria.grade_level || ''}
                        onChange={(e) => handleInputChange('target_criteria.grade_level', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Semua tingkat</option>
                        <option value="10">Kelas X</option>
                        <option value="11">Kelas XI</option>
                        <option value="12">Kelas XII</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jurusan
                      </label>
                      <select
                        value={formData.target_criteria.expertise_id}
                        onChange={(e) => handleInputChange('target_criteria.expertise_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Semua jurusan</option>
                        {expertisePrograms.map((expertise) => (
                          <option key={expertise._id} value={expertise._id}>
                            {expertise.abbreviation} - {expertise.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas Spesifik
                      </label>
                      <select
                        value={formData.target_criteria.class_id}
                        onChange={(e) => handleInputChange('target_criteria.class_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={filteredClasses.length === 0}
                      >
                        <option value="">Pilih kelas (opsional)</option>
                        {filteredClasses.map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.grade_level} {cls.expertise_details?.abbreviation} {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Proctors */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Pengawas Ujian
                </h3>

                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-gray-500">Tidak ada data guru</p>
                  ) : (
                    <div className="space-y-2">
                      {teachers.map((teacher) => (
                        <label key={teacher._id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.proctor_ids.includes(teacher._id)}
                            onChange={(e) => handleProctorChange(teacher._id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {teacher.profile_details?.full_name || teacher.login_id}
                            {teacher.department_details && (
                              <span className="text-gray-500 ml-2">
                                ({teacher.department_details.abbreviation})
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-orange-600" />
                  Pengaturan Ujian
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.shuffle_questions}
                      onChange={(e) => handleInputChange('settings.shuffle_questions', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Acak urutan soal</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.shuffle_options}
                      onChange={(e) => handleInputChange('settings.shuffle_options', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Acak urutan pilihan jawaban</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.show_results_after_submission}
                      onChange={(e) => handleInputChange('settings.show_results_after_submission', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tampilkan hasil setelah submit</span>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? 'Perbarui' : 'Simpan'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamFormModal;