import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  X,
  BookOpen,
  GraduationCap,
  Phone,
  MapPin,
  User,
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { Teacher, TeacherFilters, CreateTeacherRequest, UpdateTeacherRequest, ClassData, DepartmentData } from '../types/teacher';

const TeacherManagement: React.FC = () => {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TeacherFilters>({
    status: 'all',
    onboarding: 'all',
    department: 'all'
  });
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState<CreateTeacherRequest>({
    login_id: '',
    email: '',
    password: '',
    roles: ['teacher'],
    is_active: true,
    profile: {
      full_name: '',
      gender: '',
      birth_date: '',
      birth_place: '',
      address: '',
      phone_number: '',
      class_id: '',
      department_id: '',
    }
  });

  const [editForm, setEditForm] = useState<UpdateTeacherRequest>({});

  const fetchTeachers = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const searchFilters = {
        ...filters,
        search: searchTerm.trim() || undefined
      };
      
      const response = await teacherService.getTeachers(token, searchFilters);
      setTeachers(response.data);
      setTotalTeachers(response.recordsTotal);
      setFilteredCount(response.recordsFiltered);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    if (!token) return;
    
    try {
      const [classesData, departmentsData] = await Promise.all([
        teacherService.getClasses(token),
        teacherService.getDepartments(token)
      ]);
      setClasses(classesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [token, filters]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTeachers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDropdownData();
  }, [token]);

  const handleToggleStatus = async (teacher: Teacher) => {
    if (!token) return;
    
    try {
      setActionLoading(teacher._id);
      await teacherService.toggleTeacherStatus(token, teacher._id, !teacher.is_active);
      await fetchTeachers();
    } catch (error) {
      console.error('Error toggling teacher status:', error);
      alert('Gagal mengubah status guru');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!token || !selectedTeacher) return;
    
    try {
      setActionLoading(selectedTeacher._id);
      await teacherService.deleteTeacher(token, selectedTeacher._id);
      await fetchTeachers();
      setShowDeleteModal(false);
      setSelectedTeacher(null);
      alert('Guru berhasil dihapus');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Gagal menghapus guru');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setFormLoading(true);
      await teacherService.createTeacher(token, addForm);
      await fetchTeachers();
      setShowAddModal(false);
      resetAddForm();
      alert('Guru berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Gagal menambahkan guru');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTeacher) return;

    try {
      setFormLoading(true);
      await teacherService.updateTeacher(token, selectedTeacher._id, editForm);
      await fetchTeachers();
      setShowEditModal(false);
      setSelectedTeacher(null);
      alert('Guru berhasil diupdate');
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Gagal mengupdate guru');
    } finally {
      setFormLoading(false);
    }
  };

  const resetAddForm = () => {
    setAddForm({
      login_id: '',
      email: '',
      password: '',
      roles: ['teacher'],
      is_active: true,
      profile: {
        full_name: '',
        gender: '',
        birth_date: '',
        birth_place: '',
        address: '',
        phone_number: '',
        class_id: '',
        department_id: '',
      }
    });
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({
      login_id: teacher.login_id,
      email: teacher.email,
      is_active: teacher.is_active,
      profile: {
        full_name: teacher.profile_details?.full_name || '',
        gender: teacher.profile_details?.gender || '',
        birth_date: teacher.profile_details?.birth_date || '',
        birth_place: teacher.profile_details?.birth_place || '',
        address: teacher.profile_details?.address || '',
        phone_number: teacher.profile_details?.phone_number || '',
        class_id: teacher.class_id || '',
        department_id: teacher.department_id || '',
      }
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatClassDisplay = (classData: ClassData) => {
    return `${classData.grade_level} ${classData.expertise_details.abbreviation} ${classData.name}`;
  };

  const getStatusBadge = (teacher: Teacher) => {
    if (!teacher.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <UserX className="w-3 h-3 mr-1" />
          Nonaktif
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" />
        Aktif
      </span>
    );
  };

  const getOnboardingBadge = (teacher: Teacher) => {
    if (teacher.onboarding_completed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Selesai
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const uniqueDepartments = Array.from(
    new Set(teachers.map(t => t.department_details?.abbreviation).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Guru</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data guru dan informasi mengajar
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTeachers}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Guru</p>
              <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Guru Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.filter(t => t.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Onboarding Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.filter(t => !t.onboarding_completed).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Jurusan</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueDepartments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari guru berdasarkan nama, email, atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value as any})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            
            <select
              value={filters.onboarding}
              onChange={(e) => setFilters({...filters, onboarding: e.target.value as any})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Onboarding</option>
              <option value="completed">Selesai</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Jurusan</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results info */}
        <div className="mt-3 text-sm text-gray-600">
          Menampilkan {filteredCount} dari {totalTeachers} guru
          {searchTerm && ` untuk "${searchTerm}"`}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
              <span className="text-sm font-medium text-gray-700">Memuat data guru...</span>
            </div>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Tidak ada data guru</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Belum ada guru yang terdaftar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jurusan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onboarding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {teacher.profile_details?.full_name || teacher.login_id}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {teacher.department_details ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {teacher.department_details.abbreviation}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teacher.department_details.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(teacher)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOnboardingBadge(teacher)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(teacher.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleStatus(teacher)}
                          disabled={actionLoading === teacher._id}
                          className={`p-1.5 rounded-md transition-colors ${
                            teacher.is_active 
                              ? 'text-red-600 hover:bg-red-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={teacher.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {actionLoading === teacher._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent"></div>
                          ) : teacher.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tambah Guru Baru</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddTeacher} className="px-6 py-4 space-y-6">
              {/* Informasi Akun */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Akun</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
                    <input
                      type="text"
                      value={addForm.login_id}
                      onChange={(e) => setAddForm({...addForm, login_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informasi Pribadi */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Pribadi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={addForm.profile.full_name}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, full_name: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={addForm.profile.gender}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, gender: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={addForm.profile.birth_date}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, birth_date: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={addForm.profile.birth_place}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, birth_place: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                    <input
                      type="tel"
                      value={addForm.profile.phone_number}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, phone_number: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea
                      value={addForm.profile.address}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, address: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informasi Penugasan */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Penugasan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                    <select
                      value={addForm.profile.department_id}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, department_id: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Jurusan</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Wali (Opsional)</label>
                    <select
                      value={addForm.profile.class_id}
                      onChange={(e) => setAddForm({...addForm, profile: {...addForm.profile, class_id: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Kelas</option>
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>
                          {formatClassDisplay(cls)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Guru</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeacher(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEditTeacher} className="px-6 py-4 space-y-6">
              {/* Informasi Akun */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Akun</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
                    <input
                      type="text"
                      value={editForm.login_id || ''}
                      onChange={(e) => setEditForm({...editForm, login_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.is_active || false}
                        onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Akun Aktif</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Informasi Pribadi */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Pribadi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={editForm.profile?.full_name || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, full_name: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={editForm.profile?.gender || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, gender: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={editForm.profile?.birth_date?.split('T')[0] || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, birth_date: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={editForm.profile?.birth_place || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, birth_place: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                    <input
                      type="tel"
                      value={editForm.profile?.phone_number || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, phone_number: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea
                      value={editForm.profile?.address || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, address: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Informasi Penugasan */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Penugasan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                    <select
                      value={editForm.profile?.department_id || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, department_id: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Jurusan</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Wali (Opsional)</label>
                    <select
                      value={editForm.profile?.class_id || ''}
                      onChange={(e) => setEditForm({...editForm, profile: {...editForm.profile, class_id: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Kelas</option>
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>
                          {formatClassDisplay(cls)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Mengupdate...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detail Guru</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Dasar</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">ID Login</label>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.login_id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedTeacher)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Onboarding</label>
                    <div className="mt-1">{getOnboardingBadge(selectedTeacher)}</div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              {selectedTeacher.profile_details && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Pribadi</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Nama Lengkap</label>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedTeacher.profile_details.full_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Jenis Kelamin</label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTeacher.profile_details.gender}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Tanggal Lahir</label>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(selectedTeacher.profile_details.birth_date)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Tempat Lahir</label>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedTeacher.profile_details.birth_place}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">No. Telepon</label>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedTeacher.profile_details.phone_number}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Alamat</label>
                        <p className="text-sm font-medium text-gray-900 flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                          {selectedTeacher.profile_details.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Department Info */}
              {selectedTeacher.department_details && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Jurusan</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Nama Jurusan</label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTeacher.department_details.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Singkatan</label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTeacher.department_details.abbreviation}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Deskripsi</label>
                        <p className="text-sm text-gray-700">
                          {selectedTeacher.department_details.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Teaching Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Mata Pelajaran yang Diajar
                </h4>
                {selectedTeacher.teaching_summary && selectedTeacher.teaching_summary.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTeacher.teaching_summary.map((teaching, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-blue-900 mb-1">
                              {teaching.subject_name}
                            </h5>
                            <p className="text-xs text-blue-700 flex items-center">
                              <Building className="w-3 h-3 mr-1" />
                              Kelas: {teaching.class_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Belum ada mata pelajaran</p>
                    <p className="text-xs text-gray-400">Guru belum ditugaskan mengajar mata pelajaran apapun</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informasi Waktu</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Bergabung</label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedTeacher.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Terakhir Diupdate</label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedTeacher.updated_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Password Terakhir Diubah</label>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedTeacher.password_last_changed_at 
                        ? formatDate(selectedTeacher.password_last_changed_at)
                        : 'Belum pernah diubah'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedTeacher);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Edit Guru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Hapus Guru</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus guru <strong>{selectedTeacher.profile_details?.full_name || selectedTeacher.login_id}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteTeacher}
                  disabled={actionLoading === selectedTeacher._id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === selectedTeacher._id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Menghapus...
                    </div>
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;