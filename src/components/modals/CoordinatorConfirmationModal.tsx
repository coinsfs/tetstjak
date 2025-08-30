import React from 'react';
import { X, Save, AlertTriangle, Plus, Minus, Edit, Trash2, User, BookOpen, GraduationCap } from 'lucide-react';
import { CoordinatorAction } from '@/types/subject';
import { Subject } from '@/types/subject';
import { Teacher } from '@/types/user';

interface CoordinatorConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actions: CoordinatorAction[];
  subjects: Subject[];
  teachersMap: Map<string, Teacher>;
  availableTeacherIdsByCell: { [gradeLevel: string]: { [subjectId: string]: string[] } };
  loading: boolean;
}

const CoordinatorConfirmationModal: React.FC<CoordinatorConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actions,
  subjects,
  teachersMap,
  availableTeacherIdsByCell,
  loading
}) => {
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachersMap.get(teacherId);
    return teacher?.profile_details?.full_name || teacher?.login_id || 'Unknown Teacher';
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'update':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'delete':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getActionDescription = (action: CoordinatorAction) => {
    const subjectName = getSubjectName(action.data?.subject_id || '');
    const gradeLabel = getGradeLabel(action.data?.grade_level || 0);
    const teacherName = getTeacherName(action.data?.coordinator_id || '');

    switch (action.type) {
      case 'create':
        return `Menambah koordinator ${teacherName} untuk ${subjectName} kelas ${gradeLabel}`;
      case 'update':
        return `Mengubah koordinator ${subjectName} kelas ${gradeLabel} menjadi ${teacherName}`;
      case 'delete':
        return `Menghapus koordinator untuk ${subjectName} kelas ${gradeLabel}`;
      default:
        return 'Aksi tidak dikenal';
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
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Konfirmasi Perubahan Koordinator</h2>
              <p className="text-sm text-gray-500">Tinjau perubahan yang akan diterapkan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {actions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Perubahan</h3>
              <p className="text-gray-500">Tidak ada perubahan koordinator yang perlu disimpan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Ringkasan Perubahan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {actions.filter(a => a.type === 'create').length}
                    </div>
                    <div className="text-sm text-gray-600">Koordinator Baru</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {actions.filter(a => a.type === 'update').length}
                    </div>
                    <div className="text-sm text-gray-600">Perubahan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {actions.filter(a => a.type === 'delete').length}
                    </div>
                    <div className="text-sm text-gray-600">Penghapusan</div>
                  </div>
                </div>
              </div>

              {/* Actions List */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Detail Perubahan</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {actions.map((action, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${getActionColor(action.type)}`}
                    >
                      <div className="flex-shrink-0">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {getActionDescription(action)}
                        </p>
                        {action.data && (
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-3 h-3" />
                              <span>{getSubjectName(action.data.subject_id)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <GraduationCap className="w-3 h-3" />
                              <span>Kelas {getGradeLabel(action.data.grade_level)}</span>
                            </div>
                            {action.data.coordinator_id && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{getTeacherName(action.data.coordinator_id)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Perhatian</h4>
                    <p className="text-sm text-yellow-700">
                      Perubahan ini akan mempengaruhi struktur koordinator mata pelajaran. 
                      Pastikan Anda telah meninjau semua perubahan dengan teliti sebelum menyimpan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          {actions.length > 0 && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorConfirmationModal;