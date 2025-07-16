import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { Teacher, ClassData, DepartmentData } from '../types/teacher';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  X,
  ChevronLeft,
  ChevronRight,
  Building,
  UserCheck,
  UserX,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  GraduationCap,
  CheckCircle,
  Clock
} from 'lucide-react';

const TeacherManagement: React.FC = () => {
    const { token } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [departments, setDepartments] = useState<DepartmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [onboardingFilter, setOnboardingFilter] = useState<'all' | 'completed' | 'pending'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  // Form states
    const [formData, setFormData] = useState({
      login_id: '',
      email: '',
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
        });
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const [teachersData, classesData, departmentsData] = await Promise.all([
          teacherService.getTeachers(token),
          teacherService.getClasses(token),
          teacherService.getDepartments(token)
        ]);
        
        setTeachers(teachersData.data);
        setClasses(classesData);
        setDepartments(departmentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Get unique departments from teachers data for filter
  const availableDepartments = useMemo(() => {
    const depts = teachers
      .filter(teacher => teacher.department_details)
      .map(teacher => teacher.department_details!)
      .filter((dept, index, self) => 
        index === self.findIndex(d => d._id === dept._id)
      );
    return depts;
  }, [teachers]);

  // Filter and search logic
  const filteredTeachers = useMemo(() => {
    let filtered = [...teachers];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(teacher => {
        const fullName = teacher.profile_details?.full_name?.toLowerCase() || '';
        const email = teacher.email.toLowerCase();
        const loginId = teacher.login_id.toLowerCase();
        
        return fullName.includes(search) || 
               email.includes(search) || 
               loginId.includes(search);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(teacher => {
        if (statusFilter === 'active') return teacher.is_active;
        if (statusFilter === 'inactive') return !teacher.is_active;
        return true;
      });
    }

    // Onboarding filter
    if (onboardingFilter !== 'all') {
      filtered = filtered.filter(teacher => {
        if (onboardingFilter === 'completed') return teacher.onboarding_completed;
        if (onboardingFilter === 'pending') return !teacher.onboarding_completed;
        return true;
      });
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(teacher => 
        teacher.department_details?._id === departmentFilter
      );
    }

    return filtered;
  }, [teachers, searchTerm, statusFilter, onboardingFilter, departmentFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeachers = filteredTeachers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, onboardingFilter, departmentFilter]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const newTeacher = await teacherService.createTeacher(token, {
        login_id: formData.login_id,
        email: formData.email,
        roles: ['teacher'],
        is_active: formData.is_active,
        profile: {
          full_name: formData.profile.full_name,
          gender: formData.profile.gender,
          birth_date: formData.profile.birth_date,
          birth_place: formData.profile.birth_place,
          address: formData.profile.address,
          phone_number: formData.profile.phone_number,
          class_id: formData.profile.class_id || undefined,
          department_id: formData.profile.department_id || undefined,
        }
      });

      const completeTeacher = await teacherService.getTeacherById(token, newTeacher._id);
      console.log(completeTeacher);
      setTeachers(prev => [...prev, completeTeacher]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create teacher');
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTeacher) return;

    try {
      await teacherService.updateTeacher(token, selectedTeacher._id, {
        login_id: formData.login_id,
        email: formData.email,
        roles: ['teacher'],
        is_active: formData.is_active,
        profile: {
          full_name: formData.profile.full_name,
          gender: formData.profile.gender,
          birth_date: formData.profile.birth_date,
          birth_place: formData.profile.birth_place,
          address: formData.profile.address,
          phone_number: formData.profile.phone_number,
          class_id: formData.profile.class_id || undefined,
          department_id: formData.profile.department_id || undefined,
        }
      });

      const freshTeacher = await teacherService.getTeacherById(token, selectedTeacher._id);
      setTeachers(prev => prev.map(t => t._id === selectedTeacher._id ? freshTeacher : t));
      setShowEditModal(false);
      setSelectedTeacher(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!token || !confirm('Apakah Anda yakin ingin menghapus guru ini?')) return;

    try {
      await teacherService.deleteTeacher(token, teacherId);
      setTeachers(prev => prev.filter(t => t._id !== teacherId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete teacher');
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    if (!token) return;

    try {
      const updatedTeacher = await teacherService.toggleTeacherStatus(token, teacher._id, !teacher.is_active);
      setTeachers(prev => prev.map(t => t._id === teacher._id ? updatedTeacher : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle teacher status');
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      login_id: teacher.login_id,
      email: teacher.email,
      roles: ["teacher"],
      is_active: teacher.is_active,
      profile: {
        full_name: teacher.profile_details?.full_name || '',
        gender: teacher.profile_details?.gender || '',
        birth_date: teacher.profile_details?.birth_date.slice(0, 10) || '',
        birth_place: teacher.profile_details?.birth_place || '',
        address: teacher.profile_details?.address || '',
        phone_number: teacher.profile_details?.phone_number || '',
        class_id: teacher.profile_details?.class_id || '',
        department_id: teacher.profile_details?.department_id || '',
      }
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      login_id: '',
      email: '',
      roles: ["teacher"],
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

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOnboardingFilter('all');
    setDepartmentFilter('all');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showEllipsis = totalPages > 7;
    
    if (showEllipsis) {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    } else {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <span>Menampilkan</span>
          <span className="mx-1 font-medium text-gray-900">{startIndex + 1}</span>
          <span>-</span>
          <span className="mx-1 font-medium text-gray-900">{Math.min(endIndex, filteredTeachers.length)}</span>
          <span>dari</span>
          <span className="mx-1 font-medium text-gray-900">{filteredTeachers.length}</span>
          <span>guru</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          <div className="flex">
            {pages.map((page, index) => (
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`flex items-center px-4 py-2 text-sm font-medium border-t border-b border-gray-300 ${
                    currentPage === page
                      ? 'text-blue-600 bg-blue-50 border-blue-500 z-10'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm font-medium text-gray-700">Memuat data guru...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-7 h-7 text-blue-600 mr-3" />
              Kelola Guru
            </h1>
            <p className="text-gray-600 mt-1">Kelola data guru dan informasi terkait</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pencarian
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama, email, atau NKTAM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Onboarding Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Onboarding
            </label>
            <select
              value={onboardingFilter}
              onChange={(e) => setOnboardingFilter(e.target.value as 'all' | 'completed' | 'pending')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jurusan
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">Semua Jurusan</option>
              {availableDepartments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.abbreviation} - {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary and Reset */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{filteredTeachers.length}</span> dari <span className="font-medium text-gray-900">{teachers.length}</span> guru
            </div>
            {searchTerm && (
              <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <Search className="w-3 h-3 mr-1" />
                "{searchTerm}"
              </div>
            )}
          </div>
          
          {(searchTerm || statusFilter !== 'all' || onboardingFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Informasi Guru
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jurusan & Kelas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Onboarding
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || statusFilter !== 'all' || onboardingFilter !== 'all' || departmentFilter !== 'all'
                          ? 'Tidak ada guru yang sesuai'
                          : 'Belum ada data guru'
                        }
                      </h3>
                      <p className="text-gray-500 max-w-sm">
                        {searchTerm || statusFilter !== 'all' || onboardingFilter !== 'all' || departmentFilter !== 'all'
                          ? 'Coba ubah filter atau kata kunci pencarian untuk menemukan guru yang Anda cari'
                          : 'Mulai dengan menambahkan guru baru ke sistem'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {teacher.profile_details?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              NKTAM: {teacher.login_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          {teacher.profile_details?.phone_number || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                            {teacher.department_details?.abbreviation || 'N/A'}
                          </span>
                        </div>
                        {teacher.class_details && (
                          <div className="flex items-center">
                            <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-600">
                              Wali: {teacher.class_details.grade_level} {teacher.department_details?.abbreviation} {teacher.class_details.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(teacher)}
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                          teacher.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                        }`}
                      >
                        {teacher.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1.5" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1.5" />
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                        teacher.onboarding_completed
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {teacher.onboarding_completed ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                            Selesai
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1.5" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
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
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Guru"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>

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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Tambah Guru Baru</h2>
                    <p className="text-sm text-gray-600">Lengkapi informasi guru yang akan ditambahkan</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Informasi Akun
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NKTAM *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.login_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, login_id: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Masukkan NKTAM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="nama@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Informasi Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.profile.full_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              full_name: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Nama lengkap guru"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Kelamin *
                      </label>
                      <select
                        required
                        value={formData.profile.gender}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              gender: e.target.value,
                            },
                          }));
                        }}                                            
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Laki Laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Lahir *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.profile.birth_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              birth_date: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempat Lahir *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.profile.birth_place}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              birth_place: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Tempat lahir"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Telepon *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.profile.phone_number}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              phone_number: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.profile.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            address: e.target.value,
                          },
                        }))
                      }                      
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Alamat lengkap"
                    />
                  </div>
                </div>

                {/* Assignment Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                    Penugasan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jurusan
                      </label>
                      <select
                        value={formData.profile.department_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              department_id: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Pilih Jurusan</option>
                        {departments.map(dept => (
                          <option key={dept._id} value={dept._id}>
                            {dept.abbreviation} - {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas Wali
                      </label>
                      <select
                        value={formData.profile.class_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              class_id: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(cls => (
                          <option key={cls._id} value={cls._id}>
                            {cls.name} - {cls.expertise_details.abbreviation}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Guru</h2>
                    <p className="text-sm text-gray-600">Perbarui informasi guru {selectedTeacher.profile_details?.full_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeacher(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditTeacher} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Informasi Akun
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NKTAM *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.login_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, login_id: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Informasi Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.profile.full_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              full_name: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Kelamin *
                      </label>
                      <select
                        required
                        value={formData.profile.gender}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              gender: e.target.value,
                            },
                          }));
                        }} 
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Laki Laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Lahir *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.profile.birth_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              birth_date: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempat Lahir *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.profile.birth_place}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              birth_place: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Telepon *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.profile.phone_number}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              phone_number: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.profile.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            address: e.target.value,
                          },
                        }))
                      }                      
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Assignment Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                    Penugasan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jurusan
                      </label>
                      <select
                        value={formData.profile.department_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              department_id: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Pilih Jurusan</option>
                        {departments.map(dept => (
                          <option key={dept._id} value={dept._id}>
                            {dept.abbreviation} - {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas Wali
                      </label>
                      <select
                        value={formData.profile.class_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              class_id: e.target.value,
                            },
                          }))
                        }                        
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(cls => (
                          <option key={cls._id} value={cls._id}>
                            {cls.grade_level} {cls.expertise_details.abbreviation} {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeacher(null);
                    resetForm();
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  Update Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;