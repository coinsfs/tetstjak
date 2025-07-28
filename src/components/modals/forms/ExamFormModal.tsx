import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Settings, Users, AlertTriangle } from 'lucide-react';
import { Exam, CreateExamRequest, UpdateExamRequest, ExamSubject, ExamClassData, AcademicPeriod } from '@/types/exam';
import { ExpertiseProgram } from '@/types/common';
import { examService } from '@/services/exam';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface BasicTeacher {
  _id: string;
  full_name: string;
}

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  exam?: Exam; // For edit mode
  mode: 'create' | 'edit';
}

const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  exam,
  mode
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [classes, setClasses] = useState<ExamClassData[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [teachers, setTeachers] = useState<BasicTeacher[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<CreateExamRequest | UpdateExamRequest>({
    title: '',
    exam_type: 'quiz',
    duration_minutes: 60,
    availability_start_time: '',
    availability_end_time: '',
    settings: {
      shuffle_questions: true,
      shuffle_options: true,
      show_results_after_submission: false
    },
    proctor_ids: [],
    ...(mode === 'create' && {
      target_criteria: {
        subject_id: '',
        grade_level: undefined,
        expertise_id: '',
        class_id: ''
      }
    })
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (mode === 'edit' && exam) {
        populateFormData();
      }
    }
  }, [isOpen, mode, exam]);

  const fetchInitialData = async () => {
    if (!token) return;

    setLoadingData(true);
    try {
      const [subjectsData, expertiseData, classesData, academicData, teachersData] = await Promise.all([
        examService.getSubjects(token),
        examService.getExpertisePrograms(token),
        examService.getClasses(token),
        examService.getAcademicPeriods(token),
        examService.getBasicTeachers(token)
      ]);

      setSubjects(subjectsData);
      setExpertisePrograms(expertiseData);
      setClasses(classesData);
      setAcademicPeriods(academicData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data awal');
    } finally {
      setLoadingData(false);
    }
  };

  const populateFormData = () => {
    if (!exam) return;

    const updateData: UpdateExamRequest = {
      title: exam.title,
      exam_type: exam.exam_type,
      duration_minutes: exam.duration_minutes,
      availability_start_time: exam.availability_start_time,
      availability_end_time: exam.availability_end_time,
      settings: exam.settings,
      proctor_ids: exam.proctor_ids
    };

    setFormData(updateData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTargetCriteriaChange = (field: string, value: any) => {
    if (mode === 'create') {
      setFormData(prev => ({
        ...prev,
        target_criteria: {
          ...(prev as CreateExamRequest).target_criteria,
          [field]: value
        }
      }));
    }
  };

  const handleSettingsChange = (field: keyof CreateExamRequest['settings'], value: boolean) => {
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

    if (mode === 'create') {
      const createData = formData as CreateExamRequest;
      if (!createData.target_criteria.subject_id) {
        toast.error('Mata pelajaran harus dipilih');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await examService.createExam(token, formData as CreateExamRequest);
        toast.success('Ujian berhasil dibuat');
      } else if (exam) {
        await examService.updateExam(token, exam._id, formData as UpdateExamRequest);
        toast.success('Ujian berhasil diperbarui');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan ujian';
      toast.error(errorMessage);
      console.error('Error saving exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOfficialExam = formData.exam_type === 'official_uts' || formData.exam_type === 'official_uas';

  if (!isOpen) return null;

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
                {mode === 'create' ? 'Buat Ujian Baru' : 'Edit Ujian'}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'create' ? 'Buat ujian baru untuk siswa' : 'Perbarui informasi ujian'}
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

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-600">Memuat data...</span>
            </div>
          </div>
        ) : (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={mode === 'edit' && isOfficialExam}
                    required
                  >
                    <option value="quiz">Kuis</option>
                    <option value="daily_test">Ulangan Harian</option>
                    <option value="official_uts">UTS (Ujian Tengah Semester)</option>
                    <option value="official_uas">UAS (Ujian Akhir Semester)</option>
                  </select>
                  {mode === 'edit' && isOfficialExam && (
                    <p className="text-xs text-gray-500 mt-1">
                      Jenis ujian resmi tidak dapat diubah
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Target Criteria - Only for create mode */}
            {mode === 'create' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Target Ujian
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mata Pelajaran *
                    </label>
                    <select
                      value={(formData as CreateExamRequest).target_criteria.subject_id}
                      onChange={(e) => handleTargetCriteriaChange('subject_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="">Pilih mata pelajaran</option>
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
                      value={(formData as CreateExamRequest).target_criteria.grade_level || ''}
                      onChange={(e) => handleTargetCriteriaChange('grade_level', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua tingkat</option>
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
                      value={(formData as CreateExamRequest).target_criteria.expertise_id || ''}
                      onChange={(e) => handleTargetCriteriaChange('expertise_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua jurusan</option>
                      {expertisePrograms.map((expertise) => (
                        <option key={expertise._id} value={expertise._id}>
                          {expertise.name} ({expertise.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kelas Spesifik
                    </label>
                    <select
                      value={(formData as CreateExamRequest).target_criteria.class_id || ''}
                      onChange={(e) => handleTargetCriteriaChange('class_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua kelas</option>
                      {classes.map((classData) => (
                        <option key={classData._id} value={classData._id}>
                          Kelas {classData.grade_level} {classData.expertise_details.abbreviation} {classData.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {teachers.map((teacher) => (
                  <div key={teacher._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`proctor-${teacher._id}`}
                      checked={formData.proctor_ids.includes(teacher._id)}
                      onChange={(e) => handleProctorChange(teacher._id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`proctor-${teacher._id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {teacher.full_name}
                    </label>
                  </div>
                ))}
              </div>
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
                className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{mode === 'create' ? 'Membuat...' : 'Menyimpan...'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>{mode === 'create' ? 'Buat Ujian' : 'Simpan Perubahan'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ExamFormModal;