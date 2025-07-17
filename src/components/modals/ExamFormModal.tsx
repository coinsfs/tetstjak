import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Loader } from 'lucide-react';
import { 
  Exam, 
  CreateExamRequest, 
  UpdateExamRequest, 
  Subject, 
  ExpertiseProgram, 
  ClassData, 
  Teacher,
  EXAM_TYPES 
} from '../../types/exam';
import { examService } from '../../services/examService';
import { useAuth } from '../../contexts/AuthContext';
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    exam_type: 'quiz',
    duration_minutes: 60,
    availability_start_time: '',
    availability_end_time: '',
    status: 'draft',
    settings: {
      shuffle_questions: true,
      shuffle_options: true,
      show_results_after_submission: false
    },
    target_criteria: {
      subject_id: '',
      grade_level: '',
      expertise_id: '',
      class_id: ''
    },
    proctor_ids: [] as string[]
  });

  useEffect(() => {
    if (isOpen && token) {
      fetchFormData();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (exam) {
      // Set form data for editing
      const startTime = new Date(exam.availability_start_time);
      const endTime = new Date(exam.availability_end_time);
      
      setFormData({
        title: exam.title,
        exam_type: exam.exam_type,
        duration_minutes: exam.duration_minutes,
        availability_start_time: startTime.toISOString().slice(0, 16),
        availability_end_time: endTime.toISOString().slice(0, 16),
        status: exam.status,
        settings: exam.settings,
        target_criteria: {
          subject_id: exam.teaching_assignment_details.subject_id,
          grade_level: exam.teaching_assignment_details.class_details.grade_level.toString(),
          expertise_id: exam.teaching_assignment_details.class_details.expertise_id,
          class_id: exam.teaching_assignment_details.class_id
        },
        proctor_ids: exam.proctor_ids
      });
    } else {
      // Reset form for new exam
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: '',
        exam_type: 'quiz',
        duration_minutes: 60,
        availability_start_time: now.toISOString().slice(0, 16),
        availability_end_time: oneHourLater.toISOString().slice(0, 16),
        status: 'draft',
        settings: {
          shuffle_questions: true,
          shuffle_options: true,
          show_results_after_submission: false
        },
        target_criteria: {
          subject_id: '',
          grade_level: '',
          expertise_id: '',
          class_id: ''
        },
        proctor_ids: []
      });
    }
  }, [exam]);

  useEffect(() => {
    // Filter classes based on selected grade level and expertise
    let filtered = classes;

    if (formData.target_criteria.grade_level) {
      filtered = filtered.filter(cls => cls.grade_level.toString() === formData.target_criteria.grade_level);
    }

    if (formData.target_criteria.expertise_id) {
      filtered = filtered.filter(cls => cls.expertise_id === formData.target_criteria.expertise_id);
    }

    setFilteredClasses(filtered);
  }, [classes, formData.target_criteria.grade_level, formData.target_criteria.expertise_id]);

  const fetchFormData = async () => {
    if (!token) return;

    try {
      const [subjectsData, expertiseData, classesData, teachersData] = await Promise.all([
        examService.getSubjects(token),
        examService.getExpertisePrograms(token),
        examService.getClasses(token),
        examService.getTeachers(token)
      ]);

      setSubjects(subjectsData);
      setExpertisePrograms(expertiseData);
      setClasses(classesData);
      setTeachers(teachersData.data);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Gagal memuat data form');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingField = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else if (name.startsWith('target_criteria.')) {
      const criteriaField = name.replace('target_criteria.', '');
      setFormData(prev => ({
        ...prev,
        target_criteria: {
          ...prev.target_criteria,
          [criteriaField]: value
        }
      }));
      
      // Reset class selection when grade level or expertise changes
      if (criteriaField === 'grade_level' || criteriaField === 'expertise_id') {
        setFormData(prev => ({
          ...prev,
          target_criteria: {
            ...prev.target_criteria,
            class_id: ''
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleProctorChange = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      proctor_ids: prev.proctor_ids.includes(teacherId)
        ? prev.proctor_ids.filter(id => id !== teacherId)
        : [...prev.proctor_ids, teacherId]
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

    if (!formData.target_criteria.subject_id) {
      toast.error('Mata pelajaran harus dipilih');
      return;
    }

    if (new Date(formData.availability_start_time) >= new Date(formData.availability_end_time)) {
      toast.error('Waktu mulai harus lebih awal dari waktu selesai');
      return;
    }

    setLoading(true);
    try {
      if (exam) {
        // Update existing exam
        const updateData: UpdateExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: new Date(formData.availability_start_time).toISOString(),
          availability_end_time: new Date(formData.availability_end_time).toISOString(),
          status: formData.status,
          proctor_ids: formData.proctor_ids,
          settings: formData.settings
        };
        
        await examService.updateExam(token, exam._id, updateData);
        toast.success('Ujian berhasil diperbarui');
      } else {
        // Create new exam
        const createData: CreateExamRequest = {
          title: formData.title,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          availability_start_time: new Date(formData.availability_start_time).toISOString(),
          availability_end_time: new Date(formData.availability_end_time).toISOString(),
          settings: formData.settings,
          target_criteria: {
            subject_id: formData.target_criteria.subject_id,
            ...(formData.target_criteria.grade_level && { grade_level: parseInt(formData.target_criteria.grade_level) }),
            ...(formData.target_criteria.expertise_id && { expertise_id: formData.target_criteria.expertise_id }),
            ...(formData.target_criteria.class_id && { class_id: formData.target_criteria.class_id })
          },
          proctor_ids: formData.proctor_ids
        };
        
        await examService.createExam(token, createData);
        toast.success('Ujian baru berhasil dibuat');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
      console.error('Error saving exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!exam;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Ujian' : 'Tambah Ujian Baru'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Perbarui informasi ujian' : 'Buat ujian baru untuk siswa'}
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
                  Judul Ujian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan judul ujian"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Ujian <span className="text-red-500">*</span>
                </label>
                <select
                  name="exam_type"
                  value={formData.exam_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {EXAM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi (menit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  min="1"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="availability_start_time"
                  value={formData.availability_start_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="availability_end_time"
                  value={formData.availability_end_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Target Criteria */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Target Peserta
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="target_criteria.subject_id"
                  value={formData.target_criteria.subject_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kelas
                </label>
                <select
                  name="target_criteria.grade_level"
                  value={formData.target_criteria.grade_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Tingkat</option>
                  <option value="10">Kelas X</option>
                  <option value="11">Kelas XI</option>
                  <option value="12">Kelas XII</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurusan
                </label>
                <select
                  name="target_criteria.expertise_id"
                  value={formData.target_criteria.expertise_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Jurusan</option>
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
                  name="target_criteria.class_id"
                  value={formData.target_criteria.class_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={filteredClasses.length === 0}
                >
                  <option value="">Semua Kelas</option>
                  {filteredClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.grade_level} {cls.expertise_details.abbreviation} {cls.name} - {cls.academic_year}
                    </option>
                  ))}
                </select>
                {filteredClasses.length === 0 && formData.target_criteria.grade_level && formData.target_criteria.expertise_id && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tidak ada kelas tersedia untuk tingkat dan jurusan yang dipilih
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Proctors */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Pengawas Ujian
            </h3>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {teachers.length === 0 ? (
                <p className="text-sm text-gray-500">Tidak ada data guru tersedia</p>
              ) : (
                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <label key={teacher._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.proctor_ids.includes(teacher._id)}
                        onChange={() => handleProctorChange(teacher._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.profile_details?.full_name || teacher.login_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {teacher.login_id} - {teacher.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Dipilih: {formData.proctor_ids.length} pengawas
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Pengaturan Ujian
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="settings.shuffle_questions"
                  checked={formData.settings.shuffle_questions}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Acak Urutan Soal</div>
                  <div className="text-xs text-gray-500">Soal akan ditampilkan dalam urutan acak untuk setiap siswa</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="settings.shuffle_options"
                  checked={formData.settings.shuffle_options}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Acak Pilihan Jawaban</div>
                  <div className="text-xs text-gray-500">Pilihan jawaban akan diacak untuk setiap soal</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="settings.show_results_after_submission"
                  checked={formData.settings.show_results_after_submission}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Tampilkan Hasil Setelah Submit</div>
                  <div className="text-xs text-gray-500">Siswa dapat melihat hasil ujian langsung setelah mengirim jawaban</div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Menyimpan...' : (isEditing ? 'Perbarui' : 'Simpan')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamFormModal;