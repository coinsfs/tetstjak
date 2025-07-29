import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Subject, 
  SubjectCoordinator, 
  CoordinatorMatrix as CoordinatorMatrixType, 
  CoordinatorAction,
  TeachingAssignmentForCoordinator
} from '@/types/subject';
import { Teacher } from '@/types/user';
import { subjectService } from '@/services/subject';
import { userService } from '@/services/user';
import CoordinatorMatrix from './CoordinatorMatrix';
import CoordinatorConfirmationModal from './modals/CoordinatorConfirmationModal';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, RotateCcw, Users, AlertCircle, GraduationCap } from 'lucide-react';

interface SubjectCoordinatorManagementProps {
  onBack: () => void;
}

const GRADE_LEVELS = [10, 11, 12];

const SubjectCoordinatorManagement: React.FC<SubjectCoordinatorManagementProps> = ({ onBack }) => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [coordinators, setCoordinators] = useState<SubjectCoordinator[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignmentForCoordinator[]>([]);
  const [matrix, setMatrix] = useState<CoordinatorMatrixType>({});
  const [availableTeachers, setAvailableTeachers] = useState<{ [gradeLevel: string]: { [subjectId: string]: Teacher[] } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingActions, setPendingActions] = useState<CoordinatorAction[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // Load subjects, coordinators, and teaching assignments
        const [subjectsResponse, coordinatorsData, assignmentsData] = await Promise.all([
          subjectService.getSubjects(token, { limit: 1000 }),
          subjectService.getSubjectCoordinators(token),
          subjectService.getTeachingAssignmentsForCoordinator(token)
        ]);

        setSubjects(subjectsResponse.data);
        setCoordinators(coordinatorsData);
        setTeachingAssignments(assignmentsData);

        // Build available teachers mapping
        buildAvailableTeachersMapping(assignmentsData);

        // Initialize matrix
        initializeMatrix(subjectsResponse.data, coordinatorsData);

      } catch (error) {
        console.error('Error loading coordinator data:', error);
        toast.error('Gagal memuat data koordinator');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const buildAvailableTeachersMapping = (assignments: TeachingAssignmentForCoordinator[]) => {
    const mapping: { [gradeLevel: string]: { [subjectId: string]: Teacher[] } } = {};

    // Initialize mapping structure
    GRADE_LEVELS.forEach(grade => {
      mapping[grade.toString()] = {};
    });

    // Group assignments by grade level and subject
    assignments.forEach(assignment => {
      const gradeLevel = assignment.class_details.grade_level.toString();
      const subjectId = assignment.subject_details._id;

      if (!mapping[gradeLevel]) {
        mapping[gradeLevel] = {};
      }

      if (!mapping[gradeLevel][subjectId]) {
        mapping[gradeLevel][subjectId] = [];
      }

      // Check if teacher is already in the list for this grade-subject combination
      const existingTeacher = mapping[gradeLevel][subjectId].find(
        t => t._id === assignment.teacher_details._id
      );

      if (!existingTeacher) {
        // Convert teacher details to Teacher type
        const teacher: Teacher = {
          _id: assignment.teacher_details._id,
          login_id: assignment.teacher_details.full_name, // Using full_name as login_id for display
          email: '', // Not available in assignment data
          is_active: true,
          roles: ['teacher'],
          profile_id: '',
          class_id: null,
          department_id: null,
          onboarding_completed: true,
          password_last_changed_at: null,
          created_at: '',
          updated_at: '',
          profile_details: {
            user_id: assignment.teacher_details._id,
            full_name: assignment.teacher_details.full_name,
            gender: '',
            birth_date: '',
            birth_place: '',
            address: '',
            phone_number: '',
            class_id: null,
            department_id: null,
            start_year: null,
            end_year: null,
            profile_picture_url: assignment.teacher_details.profile_picture_url,
            profile_picture_key: null,
            created_at: '',
            updated_at: '',
            _id: ''
          },
          class_details: null,
          department_details: {
            _id: '',
            name: '',
            abbreviation: '',
            description: '',
            head_of_department_id: '',
            created_at: '',
            updated_at: ''
          },
          teaching_summary: []
        };

        mapping[gradeLevel][subjectId].push(teacher);
      }
    });

    setAvailableTeachers(mapping);
  };

  const initializeMatrix = (subjectsList: Subject[], coordinatorsList: SubjectCoordinator[]) => {
    const newMatrix: CoordinatorMatrixType = {};

    // Initialize matrix structure
    GRADE_LEVELS.forEach(grade => {
      newMatrix[grade.toString()] = {};
      subjectsList.forEach(subject => {
        newMatrix[grade.toString()][subject._id] = {
          isDirty: false
        };
      });
    });

    // Populate existing coordinators
    coordinatorsList.forEach(coordinator => {
      const gradeLevel = coordinator.grade_level.toString();
      const subjectId = coordinator.subject_id;

      if (newMatrix[gradeLevel] && newMatrix[gradeLevel][subjectId]) {
        newMatrix[gradeLevel][subjectId] = {
          coordinator,
          selectedTeacherId: coordinator.coordinator_teacher_id,
          isDirty: false,
          originalCoordinatorId: coordinator._id
        };
      }
    });

    setMatrix(newMatrix);
  };

  const handleCellChange = useCallback((gradeLevel: number, subjectId: string, teacherId: string | null) => {
    setMatrix(prevMatrix => {
      const newMatrix = { ...prevMatrix };
      const gradeKey = gradeLevel.toString();

      if (!newMatrix[gradeKey]) {
        newMatrix[gradeKey] = {};
      }

      if (!newMatrix[gradeKey][subjectId]) {
        newMatrix[gradeKey][subjectId] = { isDirty: false };
      }

      const cell = newMatrix[gradeKey][subjectId];
      const originalTeacherId = cell.coordinator?.coordinator_teacher_id;

      newMatrix[gradeKey][subjectId] = {
        ...cell,
        selectedTeacherId: teacherId || undefined,
        isDirty: teacherId !== originalTeacherId
      };

      return newMatrix;
    });
  }, []);

  const generateActions = (): CoordinatorAction[] => {
    const actions: CoordinatorAction[] = [];

    Object.entries(matrix).forEach(([gradeLevel, subjects]) => {
      Object.entries(subjects).forEach(([subjectId, cell]) => {
        if (!cell.isDirty) return;

        const originalTeacherId = cell.coordinator?.coordinator_teacher_id;
        const newTeacherId = cell.selectedTeacherId;

        if (originalTeacherId && !newTeacherId) {
          // Delete coordinator
          actions.push({
            type: 'delete',
            coordinator_id: cell.originalCoordinatorId
          });
        } else if (originalTeacherId && newTeacherId && originalTeacherId !== newTeacherId) {
          // Update coordinator
          actions.push({
            type: 'update',
            coordinator_id: cell.originalCoordinatorId,
            data: {
              subject_id: subjectId,
              grade_level: parseInt(gradeLevel),
              coordinator_teacher_id: newTeacherId
            }
          });
        } else if (!originalTeacherId && newTeacherId) {
          // Create new coordinator
          actions.push({
            type: 'create',
            data: {
              subject_id: subjectId,
              grade_level: parseInt(gradeLevel),
              coordinator_teacher_id: newTeacherId
            }
          });
        }
      });
    });

    return actions;
  };

  const handleSave = () => {
    const actions = generateActions();
    if (actions.length === 0) {
      toast.info('Tidak ada perubahan untuk disimpan');
      return;
    }

    setPendingActions(actions);
    setConfirmationModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!token || pendingActions.length === 0) return;

    setSaving(true);
    try {
      const batchRequest = { actions: pendingActions };
      await subjectService.batchUpdateCoordinators(token, batchRequest);
      
      toast.success('Perubahan koordinator berhasil disimpan');
      
      // Reload data
      const [coordinatorsData, assignmentsData] = await Promise.all([
        subjectService.getSubjectCoordinators(token),
        subjectService.getTeachingAssignmentsForCoordinator(token)
      ]);

      setCoordinators(coordinatorsData);
      setTeachingAssignments(assignmentsData);
      buildAvailableTeachersMapping(assignmentsData);
      initializeMatrix(subjects, coordinatorsData);

      setConfirmationModalOpen(false);
      setPendingActions([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan perubahan';
      toast.error(errorMessage);
      console.error('Error saving coordinators:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    initializeMatrix(subjects, coordinators);
    toast.info('Perubahan telah direset');
  };

  const hasChanges = () => {
    return Object.values(matrix).some(subjects =>
      Object.values(subjects).some(cell => cell.isDirty)
    );
  };

  const getChangesSummary = () => {
    const actions = generateActions();
    return {
      creates: actions.filter(a => a.type === 'create').length,
      updates: actions.filter(a => a.type === 'update').length,
      deletes: actions.filter(a => a.type === 'delete').length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data koordinator...</p>
        </div>
      </div>
    );
  }

  const changesSummary = getChangesSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Koordinator Mata Pelajaran</h1>
              <p className="text-gray-600">Kelola koordinator untuk setiap jenjang kelas dan mata pelajaran</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges() && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={!hasChanges() || saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Changes Summary */}
      {hasChanges() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Ada Perubahan yang Belum Disimpan</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  {changesSummary.creates > 0 && `${changesSummary.creates} koordinator baru`}
                  {changesSummary.creates > 0 && (changesSummary.updates > 0 || changesSummary.deletes > 0) && ', '}
                  {changesSummary.updates > 0 && `${changesSummary.updates} koordinator diubah`}
                  {changesSummary.updates > 0 && changesSummary.deletes > 0 && ', '}
                  {changesSummary.deletes > 0 && `${changesSummary.deletes} koordinator dihapus`}
                </p>
                <p className="font-medium">Jangan lupa untuk menyimpan perubahan Anda.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Mata Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jenjang Kelas</p>
              <p className="text-2xl font-bold text-gray-900">{GRADE_LEVELS.length}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Koordinator</p>
              <p className="text-2xl font-bold text-gray-900">{coordinators.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Posisi Tersedia</p>
              <p className="text-2xl font-bold text-gray-900">{GRADE_LEVELS.length * subjects.length}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-orange-600">{GRADE_LEVELS.length * subjects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coordinator Matrix */}
      <CoordinatorMatrix
        matrix={matrix}
        subjects={subjects}
        availableTeachers={availableTeachers}
        onCellChange={handleCellChange}
      />

      {/* Confirmation Modal */}
      <CoordinatorConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        onConfirm={handleConfirmSave}
        actions={pendingActions}
        subjects={subjects}
        availableTeachers={availableTeachers}
        loading={saving}
      />
    </div>
  );
};

export default SubjectCoordinatorManagement;