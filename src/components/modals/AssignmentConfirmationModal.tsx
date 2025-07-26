import React, { useState } from 'react';
import { X, AlertTriangle, Save, Trash2, Edit, Plus, Users, BookOpen, School, CheckCircle, XCircle } from 'lucide-react';
import { AssignmentAction } from '@/types/assignment';
import { Class } from '@/types/class';
import { Subject } from '@/types/subject';
import { Teacher } from '@/types/user';

interface AssignmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actions: AssignmentAction[];
  classes: Class[];
  subjects: Subject[];
  teachers: Teacher[];
  loading: boolean;
}

const AssignmentConfirmationModal: React.FC<AssignmentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actions,
  classes,
  subjects,
  teachers,
  loading
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const deleteActions = actions.filter(action => action.type === 'delete');
  const updateActions = actions.filter(action => action.type === 'update');
  const createActions = actions.filter(action => action.type === 'create');

  const hasDeleteActions = deleteActions.length > 0;

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c._id === classId);
    if (!cls) return 'Kelas tidak ditemukan';
    
    const gradeLabel = cls.grade_level === 10 ? 'X' : cls.grade_level === 11 ? 'XI' : 'XII';
    return `${gradeLabel} ${cls.expertise_details?.abbreviation || ''} ${cls.name}`.trim();
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Mata pelajaran tidak ditemukan';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.profile_details?.full_name || teacher?.login_id || 'Guru tidak ditemukan';
  };

  const renderActionSummary = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Create Actions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Plus className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-800">Penugasan Baru</span>
        </div>
        <div className="text-2xl font-bold text-green-900">{createActions.length}</div>
        <p className="text-sm text-green-700">akan dibuat</p>
      </div>

      {/* Update Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Edit className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">Penugasan Diubah</span>
        </div>
        <div className="text-2xl font-bold text-blue-900">{updateActions.length}</div>
        <p className="text-sm text-blue-700">akan diperbarui</p>
      </div>

      {/* Delete Actions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <span className="font-medium text-red-800">Penugasan Dihapus</span>
        </div>
        <div className="text-2xl font-bold text-red-900">{deleteActions.length}</div>
        <p className="text-sm text-red-700">akan dihapus</p>
      </div>
    </div>
  );

  const renderDeleteWarning = () => {
    if (!hasDeleteActions) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-red-800 mb-2">
              ⚠️ Peringatan: Penghapusan Data Penugasan Terdeteksi
            </h4>
            <div className="text-sm text-red-700 space-y-2">
              <p className="font-medium">
                Sistem mendeteksi ada {deleteActions.length} penugasan yang akan dihapus.
              </p>
              <p>
                <strong>PENTING:</strong> Jika data penugasan ini dihapus, maka semua data yang terkait 
                dengan penugasan tersebut akan kosong atau perlu diperbaharui.
              </p>
              
              <div className="bg-red-100 border border-red-300 rounded-md p-3 mt-3">
                <h5 className="font-semibold text-red-800 mb-2">Data yang akan terpengaruh:</h5>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Semua ujian terkait akan dihapus</strong></li>
                  <li>• Jadwal pembelajaran akan hilang</li>
                  <li>• Bank soal mata pelajaran untuk kelas ini akan terhapus</li>
                  <li>• Riwayat nilai siswa akan hilang</li>
                  <li>• Data kehadiran siswa akan terhapus</li>
                  <li>• Tugas dan materi pembelajaran akan hilang</li>
                </ul>
              </div>

              <div className="bg-orange-100 border border-orange-300 rounded-md p-3 mt-3">
                <h5 className="font-semibold text-orange-800 mb-2">💡 Rekomendasi Tindakan:</h5>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li><strong>Ganti guru</strong> pada penugasan daripada menghapus penugasan</li>
                  <li>Backup data ujian dan nilai siswa terlebih dahulu</li>
                  <li>Informasikan kepada guru dan siswa terkait perubahan ini</li>
                  <li>Pastikan ada guru pengganti yang siap mengambil alih</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActionDetails = () => {
    if (!showDetails) return null;

    return (
      <div className="space-y-4">
        {/* Delete Actions Detail */}
        {deleteActions.length > 0 && (
          <div className="border border-red-200 rounded-lg">
            <div className="bg-red-50 px-4 py-3 border-b border-red-200">
              <h4 className="font-semibold text-red-800 flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Penugasan yang akan dihapus ({deleteActions.length})
              </h4>
            </div>
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {deleteActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-md">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-900">
                      Penugasan #{index + 1}
                    </div>
                    <div className="text-sm text-red-700 space-y-1">
                      <div className="flex items-center space-x-2">
                        <School className="w-3 h-3" />
                        <span>ID: {action.assignment_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update Actions Detail */}
        {updateActions.length > 0 && (
          <div className="border border-blue-200 rounded-lg">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
              <h4 className="font-semibold text-blue-800 flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Penugasan yang akan diperbarui ({updateActions.length})
              </h4>
            </div>
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {updateActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-md">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-blue-900">
                      Penugasan #{index + 1}
                    </div>
                    {action.data && (
                      <div className="text-sm text-blue-700 space-y-1">
                        <div className="flex items-center space-x-2">
                          <School className="w-3 h-3" />
                          <span>Kelas: {getClassName(action.data.class_id)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3 h-3" />
                          <span>Mata Pelajaran: {getSubjectName(action.data.subject_id)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3" />
                          <span>Guru Baru: {getTeacherName(action.data.teacher_id)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Actions Detail */}
        {createActions.length > 0 && (
          <div className="border border-green-200 rounded-lg">
            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
              <h4 className="font-semibold text-green-800 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Penugasan baru yang akan dibuat ({createActions.length})
              </h4>
            </div>
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {createActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-green-900">
                      Penugasan Baru #{index + 1}
                    </div>
                    {action.data && (
                      <div className="text-sm text-green-700 space-y-1">
                        <div className="flex items-center space-x-2">
                          <School className="w-3 h-3" />
                          <span>Kelas: {getClassName(action.data.class_id)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3 h-3" />
                          <span>Mata Pelajaran: {getSubjectName(action.data.subject_id)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3" />
                          <span>Guru: {getTeacherName(action.data.teacher_id)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasDeleteActions ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {hasDeleteActions ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Save className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {hasDeleteActions ? 'Konfirmasi Perubahan Penugasan' : 'Konfirmasi Simpan Perubahan'}
              </h2>
              <p className="text-sm text-gray-500">
                {hasDeleteActions 
                  ? 'Peringatan: Ada penugasan yang akan dihapus'
                  : 'Tinjau perubahan sebelum menyimpan'
                }
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
        <div className="p-6 space-y-6">
          {/* Action Summary */}
          {renderActionSummary()}

          {/* Delete Warning */}
          {renderDeleteWarning()}

          {/* Show Details Toggle */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span>{showDetails ? 'Sembunyikan' : 'Tampilkan'} Detail Perubahan</span>
              <div className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </button>
          </div>

          {/* Action Details */}
          {renderActionDetails()}

          {/* Final Warning for Delete Actions */}
          {hasDeleteActions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Pastikan Anda telah mempertimbangkan hal berikut:
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Apakah ada guru pengganti yang siap mengambil alih?</li>
                    <li>Apakah data ujian dan nilai sudah di-backup?</li>
                    <li>Apakah siswa sudah diberitahu tentang perubahan ini?</li>
                    <li>Apakah lebih baik mengganti guru daripada menghapus penugasan?</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            Batal
          </button>
          
          {hasDeleteActions && (
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              Tinjau Ulang
            </button>
          )}
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
              hasDeleteActions 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>
                  {hasDeleteActions ? 'Ya, Lanjutkan Simpan' : 'Simpan Perubahan'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentConfirmationModal;