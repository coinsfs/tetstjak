import React, { useState, useEffect } from 'react';
import { X, Users, Shield, UserPlus, UserMinus, Check, AlertCircle, Crown, Settings, Search, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService, QuestionSet, CoordinationAssignment } from '@/services/questionSet';
import { getProfileImageUrl } from '@/constants/config';
import toast from 'react-hot-toast';

interface SearchedUser {
  _id: string;
  full_name: string;
  profile_picture_url: string | null;
}

interface QuestionSetPermissionModalProps {
  questionSet: QuestionSet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  myCoordinations: CoordinationAssignment[];
}

const PERMISSION_TYPES = [
  { key: 'can_view', label: 'Lihat', description: 'Dapat melihat paket soal' },
  { key: 'can_edit', label: 'Edit', description: 'Dapat mengedit informasi paket soal' },
  { key: 'can_manage_questions', label: 'Kelola Soal', description: 'Dapat menambah/hapus soal dalam paket' },
  { key: 'can_publish', label: 'Publikasi', description: 'Dapat mempublikasikan paket soal' }
];

const QuestionSetPermissionModal: React.FC<QuestionSetPermissionModalProps> = ({
  questionSet,
  isOpen,
  onClose,
  onSuccess,
  myCoordinations
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Individual permission state
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<'grant' | 'revoke'>('grant');
  
  // Bulk permission state
  const [selectedCoordinationId, setSelectedCoordinationId] = useState('');
  const [bulkPermissions, setBulkPermissions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'grant' | 'revoke'>('grant');
  const [applyToAllTeachers, setApplyToAllTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!token) return;

    setSearchLoading(true);
    try {
      const results = await questionSetService.searchUsers(token, query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Gagal mencari guru');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedPermissions([]);
    setSelectedAction('grant');
    setSelectedCoordinationId('');
    setBulkPermissions([]);
    setBulkAction('grant');
    setApplyToAllTeachers(false);
  };

  const handleUserSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    setSearchQuery(user.full_name);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handlePermissionToggle = (permission: string, isBulk: boolean = false) => {
    if (isBulk) {
      setBulkPermissions(prev => 
        prev.includes(permission)
          ? prev.filter(p => p !== permission)
          : [...prev, permission]
      );
    } else {
      setSelectedPermissions(prev => 
        prev.includes(permission)
          ? prev.filter(p => p !== permission)
          : [...prev, permission]
      );
    }
  };

  const handleSubmitIndividualPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !selectedUser || selectedPermissions.length === 0) {
      toast.error('Pilih guru dan minimal satu izin');
      return;
    }

    setLoading(true);
    try {
      await questionSetService.updateQuestionSetPermissions(
        token,
        questionSet._id,
        selectedUser._id,
        selectedPermissions,
        selectedAction
      );
      
      toast.success(`Izin berhasil ${selectedAction === 'grant' ? 'diberikan' : 'dicabut'}`);
      onSuccess();
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah izin';
      toast.error(errorMessage);
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBulkPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !selectedCoordinationId || bulkPermissions.length === 0) {
      toast.error('Pilih koordinasi dan minimal satu izin');
      return;
    }

    setLoading(true);
    try {
      await questionSetService.bulkGroupPermissions(token, {
        question_set_ids: [questionSet._id],
        coordinator_id: selectedCoordinationId,
        permissions: bulkPermissions,
        action: bulkAction,
        apply_to_all_teachers: applyToAllTeachers
      });
      
      toast.success(`Izin massal berhasil ${bulkAction === 'grant' ? 'diberikan' : 'dicabut'}`);
      onSuccess();
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah izin massal';
      toast.error(errorMessage);
      console.error('Error updating bulk permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionHolders = (permissionType: string) => {
    if (!questionSet.permission_holders) return [];
    
    switch (permissionType) {
      case 'can_view':
        return questionSet.permission_holders.can_view || [];
      case 'can_edit':
        return questionSet.permission_holders.can_edit || [];
      case 'can_manage_questions':
        return questionSet.permission_holders.can_manage_questions || [];
      case 'can_publish':
        return questionSet.permission_holders.can_publish || [];
      default:
        return [];
    }
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  // Check if user is coordinator for this question set
  const relevantCoordinations = myCoordinations.filter(coord => 
    coord.subject_id === questionSet.subject.name && // Note: might need to adjust based on actual data structure
    coord.grade_level === questionSet.grade_level
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Kelola Izin Paket Soal</h2>
              <p className="text-sm text-gray-500">Atur akses guru lain ke paket soal Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Question Set Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{questionSet.name}</h3>
              <p className="text-sm text-gray-600">{questionSet.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Mata Pelajaran: {questionSet.subject.name}</span>
                <span>Kelas: {getGradeLabel(questionSet.grade_level)}</span>
                <span>{questionSet.metadata.total_questions} soal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Current Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Izin Saat Ini
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERMISSION_TYPES.map((permType) => {
                const holders = getPermissionHolders(permType.key);
                
                return (
                  <div key={permType.key} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Crown className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900">{permType.label}</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{permType.description}</p>
                    
                    {holders.length > 0 ? (
                      <div className="space-y-2">
                        {holders.map((holder) => {
                          const profileImageUrl = holder.profile_picture_key 
                            ? holder.profile_picture_url
                            : null;
                            
                          return (
                            <div key={holder._id} className="flex items-center space-x-2">
                              {profileImageUrl ? (
                                <img
                                  src={profileImageUrl}
                                  alt={holder.full_name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                  <Users className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                              <span className="text-sm text-gray-700">{holder.full_name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Belum ada guru dengan izin ini</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Permission Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Kelola Izin Individual
            </h3>
            
            <form onSubmit={handleSubmitIndividualPermission} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Guru
                  </label>
                  <div className="relative">
                    {selectedUser ? (
                      /* Selected User Display */
                      <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {selectedUser.profile_picture_url ? (
                            <img
                              src={selectedUser.profile_picture_url}
                              alt={selectedUser.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {selectedUser.full_name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSelectedUser}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                          title="Hapus pilihan"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Search Input */
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ketik nama guru..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                          {searchLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.length > 0 ? (
                              <div className="py-1">
                                {searchResults.map((user) => (
                                  <button
                                    key={user._id}
                                    type="button"
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    {user.profile_picture_url ? (
                                      <img
                                        src={user.profile_picture_url}
                                        alt={user.full_name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <Users className="w-4 h-4 text-gray-500" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.full_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        ID: {user._id.slice(-8)}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Tidak ada guru ditemukan
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ketik minimal 2 karakter untuk mencari guru
                  </p>
                </div>

                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aksi
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="grant"
                        checked={selectedAction === 'grant'}
                        onChange={(e) => setSelectedAction(e.target.value as 'grant' | 'revoke')}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <UserPlus className="w-4 h-4 mr-1 text-green-600" />
                        Berikan Izin
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="revoke"
                        checked={selectedAction === 'revoke'}
                        onChange={(e) => setSelectedAction(e.target.value as 'grant' | 'revoke')}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <UserMinus className="w-4 h-4 mr-1 text-red-600" />
                        Cabut Izin
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Permission Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Jenis Izin
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSION_TYPES.map((permType) => (
                    <label key={permType.key} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permType.key)}
                        onChange={() => handlePermissionToggle(permType.key)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{permType.label}</div>
                        <div className="text-xs text-gray-600">{permType.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedUser || selectedPermissions.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Terapkan Izin Individual</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bulk Permission Management (for Coordinators) */}
          {relevantCoordinations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Kelola Izin Massal (Koordinator)
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Fitur Koordinator</h4>
                    <p className="text-sm text-blue-700">
                      Sebagai koordinator, Anda dapat memberikan izin secara massal kepada semua guru 
                      yang mengajar mata pelajaran ini.
                    </p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmitBulkPermission} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coordination Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Koordinasi
                    </label>
                    <select
                      value={selectedCoordinationId}
                      onChange={(e) => setSelectedCoordinationId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    >
                      <option value="">Pilih koordinasi...</option>
                      {relevantCoordinations.map((coord) => (
                        <option key={coord.coordination_assignment_id} value={coord.coordination_assignment_id}>
                          {coord.coordination_title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bulk Action Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aksi Massal
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="bulkAction"
                          value="grant"
                          checked={bulkAction === 'grant'}
                          onChange={(e) => setBulkAction(e.target.value as 'grant' | 'revoke')}
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <UserPlus className="w-4 h-4 mr-1 text-green-600" />
                          Berikan
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="bulkAction"
                          value="revoke"
                          checked={bulkAction === 'revoke'}
                          onChange={(e) => setBulkAction(e.target.value as 'grant' | 'revoke')}
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <UserMinus className="w-4 h-4 mr-1 text-red-600" />
                          Cabut
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bulk Permission Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Jenis Izin Massal
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PERMISSION_TYPES.map((permType) => (
                      <label key={permType.key} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkPermissions.includes(permType.key)}
                          onChange={() => handlePermissionToggle(permType.key, true)}
                          className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{permType.label}</div>
                          <div className="text-xs text-gray-600">{permType.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply to All Teachers */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToAllTeachers}
                      onChange={(e) => setApplyToAllTeachers(e.target.checked)}
                      className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-yellow-900">
                        Terapkan ke Semua Guru
                      </div>
                      <div className="text-xs text-yellow-700">
                        Berikan/cabut izin ini kepada semua guru yang mengajar mata pelajaran ini
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedCoordinationId || bulkPermissions.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Terapkan Izin Massal</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Informasi Izin</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Lihat</strong>: Dapat melihat paket soal dan isinya</li>
                  <li>• <strong>Edit</strong>: Dapat mengubah nama, deskripsi, dan pengaturan paket soal</li>
                  <li>• <strong>Kelola Soal</strong>: Dapat menambah, menghapus, dan mengatur soal dalam paket</li>
                  <li>• <strong>Publikasi</strong>: Dapat mempublikasikan atau mengarsipkan paket soal</li>
                  <li>• Sebagai pembuat paket soal, Anda selalu memiliki semua izin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetPermissionModal;