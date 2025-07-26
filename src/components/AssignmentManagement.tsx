import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { websocketService } from '@/services/websocket';
import { 
  TeachingAssignment, 
  AssignmentMatrix as AssignmentMatrixType, 
  AssignmentAction, 
  AssignmentDraft,
  BulkUpdateProgress,
  BulkUpdateComplete
} from '@/types/assignment';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { Teacher } from '@/types/user';
import { assignmentService } from '@/services/assignment';
import { classService } from '@/services/class';
import { subjectService } from '@/services/subject';
import { userService } from '@/services/user';
import AssignmentMatrix from './AssignmentMatrix';
import AssignmentConfirmationModal from './modals/AssignmentConfirmationModal';
import toast from 'react-hot-toast';
import { 
  Users, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';

const DRAFT_STORAGE_KEY = 'assignment_draft';
const TASK_ID_STORAGE_KEY = 'assignment_task_id';

const AssignmentManagement: React.FC = () => {
  const { token } = useAuth();
  
  // Data states
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Matrix state
  const [matrix, setMatrix] = useState<AssignmentMatrixType>({});
  const [originalMatrix, setOriginalMatrix] = useState<AssignmentMatrixType>({});
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingActions, setPendingActions] = useState<AssignmentAction[]>([]);
  
  // Bulk update progress states
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState<{
    isActive: boolean;
    taskId: string | null;
    processed: number;
    total: number;
    success: number;
    failed: number;
    status: string;
    errors: string[];
  }>({
    isActive: false,
    taskId: null,
    processed: 0,
    total: 0,
    success: 0,
    failed: 0,
    status: '',
    errors: []
  });

  // Load draft from localStorage
  const loadDraft = useCallback((): AssignmentDraft | null => {
    try {
      const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftStr) {
        const draft: AssignmentDraft = JSON.parse(draftStr);
        // Check if draft is not too old (24 hours)
        const isValid = Date.now() - draft.timestamp < 24 * 60 * 60 * 1000;
        return isValid ? draft : null;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback((matrixData: AssignmentMatrixType) => {
    try {
      const draft: AssignmentDraft = {
        matrix: matrixData,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, []);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  }, []);

  // Save task ID to localStorage
  const saveTaskId = useCallback((taskId: string) => {
    localStorage.setItem(TASK_ID_STORAGE_KEY, taskId);
  }, []);

  // Clear task ID from localStorage
  const clearTaskId = useCallback(() => {
    localStorage.removeItem(TASK_ID_STORAGE_KEY);
  }, []);

  // Get task ID from localStorage
  const getStoredTaskId = useCallback((): string | null => {
    return localStorage.getItem(TASK_ID_STORAGE_KEY);
  }, []);
  // Build matrix from assignments data
  const buildMatrix = useCallback((assignmentsData: TeachingAssignment[]): AssignmentMatrixType => {
    const newMatrix: AssignmentMatrixType = {};
    
    // Initialize matrix for all class-subject combinations
    classes.forEach(cls => {
      newMatrix[cls._id] = {};
      subjects.forEach(subject => {
        newMatrix[cls._id][subject._id] = {
          isDirty: false
        };
      });
    });

    // Populate with existing assignments
    assignmentsData.forEach(assignment => {
      if (newMatrix[assignment.class_id] && newMatrix[assignment.class_id][assignment.subject_id]) {
        newMatrix[assignment.class_id][assignment.subject_id] = {
          assignment,
          selectedTeacherId: assignment.teacher_id,
          isDirty: false,
          originalAssignmentId: assignment._id
        };
      }
    });

    return newMatrix;
  }, [classes, subjects]);

  // Fetch all required data
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [assignmentsData, classesData, subjectsData, teachersData] = await Promise.all([
        assignmentService.getTeachingAssignments(token),
        classService.getClasses(token, { limit: 1000 }),
        subjectService.getSubjects(token, { limit: 1000 }),
        userService.getTeachers(token, { limit: 1000 })
      ]);

      setAssignments(assignmentsData);
      setClasses(classesData.data || []);
      setSubjects(subjectsData.data || []);
      setTeachers(teachersData.data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initialize matrix after data is loaded
  useEffect(() => {
    if (classes.length > 0 && subjects.length > 0 && assignments.length >= 0) {
      const newMatrix = buildMatrix(assignments);
      setMatrix(newMatrix);
      setOriginalMatrix(JSON.parse(JSON.stringify(newMatrix)));
      
      // Check for existing draft
      const draft = loadDraft();
      setHasDraft(!!draft);
    }
  }, [classes, subjects, assignments, buildMatrix, loadDraft]);

  // Check for changes
  useEffect(() => {
    const hasAnyChanges = Object.keys(matrix).some(classId =>
      Object.keys(matrix[classId]).some(subjectId =>
        matrix[classId][subjectId].isDirty
      )
    );
    setHasChanges(hasAnyChanges);

    // Auto-save draft if there are changes
    if (hasAnyChanges) {
      saveDraft(matrix);
    }
  }, [matrix, saveDraft]);

  // Load initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check for existing task on component mount
  useEffect(() => {
    const checkExistingTask = async () => {
      const storedTaskId = getStoredTaskId();
      if (storedTaskId && token) {
        try {
          const taskStatus = await assignmentService.getTaskStatus(token, storedTaskId);
          
          if (taskStatus.status === 'SUCCESS' || taskStatus.status === 'PARTIAL_SUCCESS' || taskStatus.status === 'FAILED') {
            // Task completed, clear storage and refresh data
            clearTaskId();
            await fetchData();
            
            if (taskStatus.status === 'SUCCESS') {
              toast.success('Penugasan berhasil disimpan');
            } else if (taskStatus.status === 'PARTIAL_SUCCESS') {
              toast.success('Penugasan sebagian berhasil disimpan');
            } else {
              toast.error('Gagal menyimpan penugasan');
            }
          } else {
            // Task still in progress, set up progress tracking
            setBulkUpdateProgress(prev => ({
              ...prev,
              isActive: true,
              taskId: storedTaskId,
              status: taskStatus.status
            }));
          }
        } catch (error) {
          console.error('Error checking task status:', error);
          clearTaskId();
        }
      }
    };

    checkExistingTask();
  }, [token, getStoredTaskId, clearTaskId, fetchData]);

  // Extract task completion logic untuk reusability
  const handleTaskCompletion = useCallback(async (taskId: string, taskStatus: any) => {
    // Clear task ID and refresh data
    clearTaskId();
    clearDraft();
    
    // Show completion message
    if (taskStatus.status === 'SUCCESS') {
      toast.success(`Penugasan berhasil disimpan`);
    } else if (taskStatus.status === 'PARTIAL_SUCCESS') {
      toast.success(`Penugasan sebagian berhasil disimpan`);
    } else {
      toast.error(`Gagal menyimpan penugasan`);
    }

    // Update progress state
    setBulkUpdateProgress({
      isActive: false,
      taskId: null,
      processed: 0,
      total: 0,
      success: 0,
      failed: 0,
      status: '',
      errors: []
    });

    // Refresh data after completion
    await fetchData();
  }, [clearTaskId, clearDraft, fetchData]);

  // WebSocket message handlers
  useEffect(() => {
    const handleBulkUpdateProgress = (data: BulkUpdateProgress) => {
      if (data.task_id === bulkUpdateProgress.taskId) {
        setBulkUpdateProgress(prev => ({
          ...prev,
          processed: data.processed,
          total: data.total,
          success: data.success,
          failed: data.failed,
          errors: data.errors || []
        }));
      }
    };

    const handleBulkUpdateComplete = async (data: BulkUpdateComplete) => {
      if (data.task_id === bulkUpdateProgress.taskId) {
        // Use centralized completion handler
        await handleTaskCompletion(data.task_id, {
          status: data.status,
          details: data.details
        });
      }
    };

    websocketService.onMessage('bulk_update_progress', handleBulkUpdateProgress);
    websocketService.onMessage('bulk_update_complete', handleBulkUpdateComplete);

    return () => {
      websocketService.offMessage('bulk_update_progress');
      websocketService.offMessage('bulk_update_complete');
    };
  }, [bulkUpdateProgress.taskId, handleTaskCompletion]);

  // Handle cell change
  const handleCellChange = useCallback((classId: string, subjectId: string, teacherId: string | null) => {
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const cell = newMatrix[classId][subjectId];
      const originalCell = originalMatrix[classId][subjectId];

      newMatrix[classId][subjectId] = {
        ...cell,
        selectedTeacherId: teacherId || undefined,
        isDirty: true
      };

      return newMatrix;
    });
  }, [originalMatrix]);

  // Generate actions for batch update
  const generateActions = useCallback((): AssignmentAction[] => {
    const actions: AssignmentAction[] = [];

    Object.keys(matrix).forEach(classId => {
      Object.keys(matrix[classId]).forEach(subjectId => {
        const cell = matrix[classId][subjectId];
        const originalCell = originalMatrix[classId][subjectId];

        if (!cell.isDirty) return;

        const hasOriginalAssignment = !!originalCell.assignment;
        const hasNewSelection = !!cell.selectedTeacherId;

        if (hasOriginalAssignment && hasNewSelection) {
          // UPDATE: Had assignment, now has different teacher
          if (cell.selectedTeacherId !== originalCell.assignment?.teacher_id) {
            actions.push({
              type: 'update',
              assignment_id: originalCell.originalAssignmentId,
              data: {
                class_id: classId,
                subject_id: subjectId,
                teacher_id: cell.selectedTeacherId!
              }
            });
          }
        } else if (hasOriginalAssignment && !hasNewSelection) {
          // DELETE: Had assignment, now empty
          actions.push({
            type: 'delete',
            assignment_id: originalCell.originalAssignmentId!
          });
        } else if (!hasOriginalAssignment && hasNewSelection) {
          // CREATE: Was empty, now has teacher
          actions.push({
            type: 'create',
            data: {
              class_id: classId,
              subject_id: subjectId,
              teacher_id: cell.selectedTeacherId!
            }
          });
        }
      });
    });

    return actions;
  }, [matrix, originalMatrix]);

  // Handle save changes
  const handleSaveChanges = useCallback(() => {
    if (!token || !hasChanges || bulkUpdateProgress.isActive) return;

    const actions = generateActions();
    if (actions.length === 0) {
      toast('Tidak ada perubahan untuk disimpan');
      return;
    }

    // Store actions and show confirmation modal
    setPendingActions(actions);
    setShowConfirmationModal(true);
  }, [token, hasChanges, bulkUpdateProgress.isActive, generateActions]);

  // Handle confirmed save
  const handleConfirmedSave = useCallback(async () => {
    if (!token || pendingActions.length === 0) return;

    try {
      setSaving(true);
      
      const response = await assignmentService.batchUpdateAssignments(token, { actions: pendingActions });
      
      // Save task ID and start progress tracking
      saveTaskId(response.task_id);
      setBulkUpdateProgress({
        isActive: true,
        taskId: response.task_id,
        processed: 0,
        total: pendingActions.length,
        success: 0,
        failed: 0,
        status: response.status,
        errors: []
      });
      
      // Close confirmation modal
      setShowConfirmationModal(false);
      setPendingActions([]);
      
      toast('Proses penyimpanan penugasan dimulai...');
      
      // Immediate status check untuk mengatasi race condition
      setTimeout(async () => {
        try {
          const taskStatus = await assignmentService.getTaskStatus(token, response.task_id);
          
          // Jika task sudah selesai, handle completion
          if (taskStatus.status === 'SUCCESS' || taskStatus.status === 'PARTIAL_SUCCESS' || taskStatus.status === 'FAILED') {
            await handleTaskCompletion(response.task_id, taskStatus);
          }
        } catch (error) {
          console.error('Error checking immediate task status:', error);
        }
      }, 1000); // Check after 1 second
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      toast.error(errorMessage);
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  }, [token, pendingActions, saveTaskId]);

  // Handle restore draft
  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setMatrix(draft.matrix);
      toast.success('Draft berhasil dipulihkan');
      setHasDraft(false);
    }
  }, [loadDraft]);

  // Handle reset changes
  const handleResetChanges = useCallback(() => {
    if (bulkUpdateProgress.isActive) {
      toast.error('Tidak dapat mereset saat proses penyimpanan berlangsung');
      return;
    }
    
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    clearDraft();
    toast.info('Perubahan berhasil direset');
  }, [originalMatrix, clearDraft, bulkUpdateProgress.isActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data penugasan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Penugasan</h1>
            <p className="text-gray-600">Manajemen penugasan guru mengajar mata pelajaran</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Draft Actions */}
          {hasDraft && (
            <button
              onClick={handleRestoreDraft}
              className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto"
            >
              <FileText className="w-4 h-4" />
              <span>Pulihkan Draft</span>
            </button>
          )}
          
          {/* Reset Button */}
          {hasChanges && (
            <button
              onClick={handleResetChanges}
              className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
          
          {/* Save Button */}
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges || saving || bulkUpdateProgress.isActive}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          >
            {saving || bulkUpdateProgress.isActive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {bulkUpdateProgress.isActive 
                    ? `Memproses... (${bulkUpdateProgress.processed}/${bulkUpdateProgress.total})`
                    : 'Menyimpan...'
                  }
                </span>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Kelas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Mata Pelajaran</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Guru</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Penugasan Aktif</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {(hasChanges || hasDraft) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-yellow-800">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">Ada perubahan yang belum disimpan</span>
              </div>
            )}
            {hasDraft && (
              <div className="flex items-center space-x-2 text-orange-800">
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">Draft tersedia untuk dipulihkan</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Update Progress */}
      {bulkUpdateProgress.isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-blue-900">
                Memproses Penugasan
              </h4>
              <p className="text-xs text-blue-700">
                {bulkUpdateProgress.processed} dari {bulkUpdateProgress.total} penugasan telah diproses
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${bulkUpdateProgress.total > 0 ? (bulkUpdateProgress.processed / bulkUpdateProgress.total) * 100 : 0}%` 
              }}
            ></div>
          </div>
          
          {/* Progress Details */}
          <div className="flex flex-col sm:flex-row justify-between text-xs text-blue-700 space-y-1 sm:space-y-0">
            <span>Berhasil: {bulkUpdateProgress.success}</span>
            <span>Gagal: {bulkUpdateProgress.failed}</span>
            <span>Progress: {bulkUpdateProgress.total > 0 ? Math.round((bulkUpdateProgress.processed / bulkUpdateProgress.total) * 100) : 0}%</span>
          </div>
          
          {/* Errors */}
          {bulkUpdateProgress.errors.length > 0 && (
            <div className="mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-xs font-medium text-red-800 mb-1">Error:</p>
              <ul className="text-xs text-red-700 space-y-1">
                {bulkUpdateProgress.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Assignment Matrix */}
      <AssignmentMatrix
        matrix={matrix}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        onCellChange={handleCellChange}
      />

      {/* Confirmation Modal */}
      <AssignmentConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setPendingActions([]);
        }}
        onConfirm={handleConfirmedSave}
        actions={pendingActions}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        loading={saving}
      />
    </div>
  );
};

export default AssignmentManagement;