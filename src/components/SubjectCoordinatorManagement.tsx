
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Save, RotateCcw, AlertCircle, CheckCircle, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CoordinatorMatrix from './CoordinatorMatrix';
import { subjectService } from '@/services/subject';
import { Subject, SubjectCoordinator, type CoordinatorMatrix, CoordinatorAction } from '@/types/subject';
import { Teacher } from '@/types/user';
import CoordinatorConfirmationModal from './modals/CoordinatorConfirmationModal';
import toast from 'react-hot-toast';

const SubjectCoordinatorManagement: React.FC = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [coordinators, setCoordinators] = useState<SubjectCoordinator[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<CoordinatorMatrix>({});
  const [availableTeachers, setAvailableTeachers] = useState<{ [gradeLevel: string]: { [subjectId: string]: Teacher[] } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingActions, setPendingActions] = useState<CoordinatorAction[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<{ _id: string } | null>(null);

  const GRADE_LEVELS = [10, 11, 12];

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // Load all required data in parallel
        const [
          subjectsResponse,
          coordinatorsData,
          teachersData,
          teachingAssignmentsData,
          academicPeriodData
        ] = await Promise.all([
          subjectService.getSubjects(token, { limit: 1000 }),
          subjectService.getSubjectCoordinators(token),
          subjectService.getTeachers(token),
          subjectService.getTeachingAssignmentsForCoordinator(token),
          subjectService.getActiveAcademicPeriod(token)
        ]);

        setSubjects(subjectsResponse.data || []);
        setCoordinators(coordinatorsData);
        setTeachers(teachersData);
        setTeachingAssignments(teachingAssignmentsData);
        setActiveAcademicPeriod(academicPeriodData);

        console.log('Loaded coordinators:', coordinatorsData);
        console.log('Loaded teachers:', teachersData);
        console.log('Loaded teaching assignments:', teachingAssignmentsData);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Build available teachers mapping based on teaching assignments
  useEffect(() => {
    const buildAvailableTeachers = () => {
      const mapping: { [gradeLevel: string]: { [subjectId: string]: Teacher[] } } = {};

      // Initialize structure
      GRADE_LEVELS.forEach(gradeLevel => {
        mapping[gradeLevel.toString()] = {};
        subjects.forEach(subject => {
          mapping[gradeLevel.toString()][subject._id] = [];
        });
      });

      // Fill with teachers based on teaching assignments
      teachingAssignments.forEach(assignment => {
        const gradeLevel = assignment.class_details.grade_level;
        const subjectId = assignment.subject_details._id;
        const teacherId = assignment.teacher_details._id;

        if (mapping[gradeLevel.toString()] && mapping[gradeLevel.toString()][subjectId]) {
          // Find teacher in teachers array
          const teacher = teachers.find(t => t._id === teacherId);
          if (teacher) {
            // Check if teacher is not already added
            const exists = mapping[gradeLevel.toString()][subjectId].some(t => t._id === teacherId);
            if (!exists) {
              mapping[gradeLevel.toString()][subjectId].push(teacher);
            }
          }
        }
      });

      console.log('Available teachers mapping:', mapping);
      setAvailableTeachers(mapping);
    };

    if (subjects.length > 0 && teachers.length > 0 && teachingAssignments.length > 0) {
      buildAvailableTeachers();
    }
  }, [subjects, teachers, teachingAssignments]);

  // Build matrix from coordinators data
  useEffect(() => {
    const buildMatrix = () => {
      const newMatrix: CoordinatorMatrix = {};

      // Initialize matrix structure
      GRADE_LEVELS.forEach(gradeLevel => {
        newMatrix[gradeLevel.toString()] = {};
        subjects.forEach(subject => {
          newMatrix[gradeLevel.toString()][subject._id] = {
            isDirty: false
          };
        });
      });

      // Fill matrix with existing coordinators
      coordinators.forEach(coordinator => {
        const gradeLevel = coordinator.grade_level.toString();
        const subjectId = coordinator.subject_id;

        if (newMatrix[gradeLevel] && newMatrix[gradeLevel][subjectId]) {
          newMatrix[gradeLevel][subjectId] = {
            coordinator,
            selectedCoordinatorId: coordinator.coordinator_id,
            isDirty: false,
            originalCoordinatorId: coordinator.coordinator_id
          };
        }
      });

      console.log('Built matrix:', newMatrix);
      setMatrix(newMatrix);
    };

    if (subjects.length > 0 && coordinators.length > 0) {
      buildMatrix();
    }
  }, [subjects, coordinators]);

  const handleCellChange = useCallback((gradeLevel: number, subjectId: string, coordinatorId: string | null) => {
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const cell = newMatrix[gradeLevel.toString()][subjectId];
      
      if (!cell) return prev;

      const originalCoordinatorId = cell.originalCoordinatorId;
      const hasOriginalCoordinator = !!originalCoordinatorId;

      // Update cell
      newMatrix[gradeLevel.toString()][subjectId] = {
        ...cell,
        selectedCoordinatorId: coordinatorId || undefined,
        isDirty: coordinatorId !== originalCoordinatorId
      };

      return newMatrix;
    });
  }, []);

  const generateActions = useCallback((): CoordinatorAction[] => {
    const actions: CoordinatorAction[] = [];

    Object.entries(matrix).forEach(([gradeLevel, subjectMatrix]) => {
      Object.entries(subjectMatrix).forEach(([subjectId, cell]) => {
        if (!cell.isDirty) return;

        const originalCoordinatorId = cell.originalCoordinatorId;
        const selectedCoordinatorId = cell.selectedCoordinatorId;
        const hasOriginal = !!originalCoordinatorId;
        const hasSelected = !!selectedCoordinatorId;

        if (!hasOriginal && hasSelected) {
          // Create new coordinator
          actions.push({
            type: 'create',
            data: {
              subject_id: subjectId,
              grade_level: parseInt(gradeLevel),
              coordinator_id: selectedCoordinatorId
            }
          });
        } else if (hasOriginal && hasSelected && originalCoordinatorId !== selectedCoordinatorId) {
          // Update existing coordinator
          const coordinator = cell.coordinator;
          if (coordinator) {
            actions.push({
              type: 'update',
              id: coordinator._id,
              data: {
                subject_id: subjectId,
                grade_level: parseInt(gradeLevel),
                coordinator_id: selectedCoordinatorId
              }
            });
          }
        } else if (hasOriginal && !hasSelected) {
          // Delete coordinator
          const coordinator = cell.coordinator;
          if (coordinator) {
            actions.push({
              type: 'delete',
              id: coordinator._id
            });
          }
        }
      });
    });

    return actions;
  }, [matrix]);

  const handleSave = useCallback(() => {
    const actions = generateActions();
    if (actions.length === 0) {
      toast.info('Tidak ada perubahan untuk disimpan');
      return;
    }

    setPendingActions(actions);
    setShowConfirmation(true);
  }, [generateActions]);

  const handleConfirmSave = useCallback(async () => {
    if (!token || !activeAcademicPeriod) {
      toast.error('Academic period tidak ditemukan');
      return;
    }

    setSaving(true);
    try {
      const request = {
        operations: pendingActions,
        academic_period_id: activeAcademicPeriod._id
      };

      console.log('Sending batch request:', request);
      
      await subjectService.batchUpdateCoordinators(token, request);
      
      toast.success('Koordinator berhasil diperbarui');
      
      // Reload data
      const [coordinatorsData] = await Promise.all([
        subjectService.getSubjectCoordinators(token)
      ]);
      
      setCoordinators(coordinatorsData);
      setShowConfirmation(false);
      setPendingActions([]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan perubahan';
      toast.error(errorMessage);
      console.error('Error saving coordinators:', error);
    } finally {
      setSaving(false);
    }
  }, [token, pendingActions, activeAcademicPeriod]);

  const handleReset = useCallback(() => {
    // Reset matrix to original state
    const resetMatrix: CoordinatorMatrix = {};

    GRADE_LEVELS.forEach(gradeLevel => {
      resetMatrix[gradeLevel.toString()] = {};
      subjects.forEach(subject => {
        const existingCoordinator = coordinators.find(
          c => c.grade_level === gradeLevel && c.subject_id === subject._id
        );

        resetMatrix[gradeLevel.toString()][subject._id] = {
          coordinator: existingCoordinator,
          selectedCoordinatorId: existingCoordinator?.coordinator_id,
          isDirty: false,
          originalCoordinatorId: existingCoordinator?.coordinator_id
        };
      });
    });

    setMatrix(resetMatrix);
    toast.info('Matrix telah direset ke kondisi awal');
  }, [subjects, coordinators]);

  const hasChanges = Object.values(matrix).some(subjectMatrix =>
    Object.values(subjectMatrix).some(cell => cell.isDirty)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          <span className="text-lg font-medium text-gray-700">Memuat data koordinator...</span>
        </div>
      </div>
    );
  }

  if (!activeAcademicPeriod) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Academic Period Tidak Aktif</h3>
        <p className="text-gray-500">
          Tidak ada academic period yang aktif. Silakan aktifkan academic period terlebih dahulu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Koordinator Mata Pelajaran</h1>
            <p className="text-gray-600">Kelola koordinator untuk setiap mata pelajaran dan jenjang kelas</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Mata Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Jenjang Kelas</p>
              <p className="text-2xl font-bold text-gray-900">{GRADE_LEVELS.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Koordinator Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{coordinators.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            {hasChanges ? (
              <AlertCircle className="w-8 h-8 text-orange-500" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-bold text-gray-900">
                {hasChanges ? 'Ada Perubahan' : 'Tersimpan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <CoordinatorMatrix
        matrix={matrix}
        subjects={subjects}
        availableTeachers={availableTeachers}
        onCellChange={handleCellChange}
      />

      {/* Confirmation Modal */}
      <CoordinatorConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
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