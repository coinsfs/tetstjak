import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  ArrowLeft,
  Search,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  User,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { teacherService, TeachingClass, ClassStudent } from '@/services/teacher';
import StudentDetailModal from '@/components/modals/details/StudentDetailModal';
import { getProfileImageUrl } from '@/constants/config';
import toast from 'react-hot-toast';

const TeacherClassesPage: React.FC = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeachingClass | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal states
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<ClassStudent | null>(null);
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchTeachingSummary();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setCurrentPage(1); // Reset to first page when class changes
      fetchClassStudents(selectedClass.class_details._id, 1, itemsPerPage, searchQuery);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass.class_details._id, currentPage, itemsPerPage, searchQuery);
    }
  }, [currentPage, searchQuery]);

  const fetchTeachingSummary = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await teacherService.getTeachingSummary(token);
      setClasses(response.classes);
    } catch (error) {
      console.error('Error fetching teaching summary:', error);
      toast.error('Gagal memuat daftar kelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string, page: number, limit: number, search?: string) => {
    if (!token) return;

    try {
      setStudentsLoading(true);
      const response = await teacherService.getClassStudents(token, classId, page, limit, search);
      setStudents(response.data);
      setTotalPages(response.total_pages);
      setCurrentPage(response.current_page);
      setTotalItems(response.total_items);
      setItemsPerPage(response.limit);
    } catch (error) {
      console.error('Error fetching class students:', error);
      toast.error('Gagal memuat daftar siswa');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleViewStudentDetail = (student: ClassStudent) => {
    setSelectedStudentForModal(student);
    setIsStudentDetailModalOpen(true);
  };

  const handleCloseStudentDetailModal = () => {
    setIsStudentDetailModalOpen(false);
    setSelectedStudentForModal(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  const getProfileImage = (student: ClassStudent) => {
    const profileUrl = student.profile_details?.profile_picture_key;
    if (profileUrl) {
      return getProfileImageUrl(profileUrl);
    }
    return null;
  };

  const getInitials = (student: ClassStudent) => {
    const fullName = student.profile_details?.full_name || student.login_id || 'S';
    return fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatBirthDate = (birthDate: string) => {
    return new Date(birthDate).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div>
          <span className="text-gray-600">Memuat daftar kelas...</span>
        </div>
      </div>
    );
  }

  // Class Detail View
  if (selectedClass) {
    return (
      <>
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedClass(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali ke Daftar Kelas</span>
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kelas {getGradeLabel(selectedClass.class_details.grade_level)} {selectedClass.expertise_details.abbreviation} {selectedClass.class_details.name}
              </h1>
              <p className="text-gray-600">{selectedClass.expertise_details.name}</p>
              <p className="text-sm text-gray-500">Tahun Ajaran {selectedClass.class_details.academic_year}</p>
            </div>
          </div>

          {/* Class Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Siswa</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedClass.total_students}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Mata Pelajaran</p>
                  <p className="text-2xl font-bold text-green-900">{selectedClass.assignments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Tahun Ajaran</p>
                  <p className="text-lg font-bold text-purple-900">{selectedClass.class_details.academic_year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Taught */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Mata Pelajaran yang Diajar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedClass.assignments.map((assignment, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{assignment.name}</p>
                      <p className="text-sm text-gray-600">{assignment.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Daftar Siswa</h2>
              <div className="text-sm text-gray-500">
                Menampilkan {students.length} dari {totalItems} siswa
              </div>
            </div>
          </div>
          
          {studentsLoading ? (
            <div className="flex items-center justify-center py-12 px-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                <span className="text-gray-600">Memuat daftar siswa...</span>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery ? 'Tidak ada siswa yang ditemukan' : 'Belum ada siswa di kelas ini'}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Login ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telepon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="relative flex-shrink-0">
                              {getProfileImage(student) ? (
                                <img
                                  src={getProfileImage(student)!}
                                  alt="Profile"
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallbackDiv = target.nextElementSibling as HTMLElement;
                                    if (fallbackDiv) {
                                      fallbackDiv.classList.remove('hidden');
                                    }
                                  }}
                                />
                              ) : null}
                              <div className={`w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200 ${getProfileImage(student) ? 'hidden' : ''}`}>
                                <span className="text-sm font-semibold text-green-700">
                                  {getInitials(student)}
                                </span>
                              </div>
                              {student.is_active && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                                  <UserCheck className="w-2 h-2 text-white m-0.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {student.profile_details?.full_name || student.login_id}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                {student.profile_details?.gender || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.login_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate max-w-xs" title={student.email}>
                            {student.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.profile_details?.phone_number || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleViewStudentDetail(student)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> sampai{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari{' '}
                      <span className="font-medium">{totalItems}</span> siswa
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Sebelumnya
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
                                currentPage === pageNumber
                                  ? 'border-green-500 bg-green-50 text-green-600'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Berikutnya
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        </div>

        {/* Student Detail Modal */}
        {isStudentDetailModalOpen && selectedStudentForModal && (
          <StudentDetailModal
            student={selectedStudentForModal}
            isOpen={isStudentDetailModalOpen}
            onClose={handleCloseStudentDetailModal}
          />
        )}
      </>
    );
  }

  // Classes List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
            <p className="text-gray-600">Kelola kelas yang Anda ajar</p>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Kelas
            </h3>
            <p className="text-gray-600">
              Anda belum memiliki penugasan mengajar di kelas manapun.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((classItem, index) => (
            <div
              key={index}
              onClick={() => setSelectedClass(classItem)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-green-200 p-6"
            >
              <div className="flex items-center justify-between">
                {/* Left Section - Class Info */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                      Kelas {getGradeLabel(classItem.class_details.grade_level)} {classItem.expertise_details.abbreviation} {classItem.class_details.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-2 truncate">
                      {classItem.expertise_details.name}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Tahun Ajaran {classItem.class_details.academic_year}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{classItem.total_students} siswa</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Section - Subjects */}
                <div className="hidden md:flex flex-1 max-w-md mx-6">
                  <div className="w-full">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Mata Pelajaran</h4>
                    <div className="flex flex-wrap gap-2">
                      {classItem.assignments.slice(0, 4).map((assignment, assignmentIndex) => (
                        <div key={assignmentIndex} className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800 truncate max-w-20">
                            {assignment.name}
                          </span>
                        </div>
                      ))}
                      {classItem.assignments.length > 4 && (
                        <div className="px-3 py-1 bg-gray-100 rounded-full">
                          <span className="text-xs text-gray-600">
                            +{classItem.assignments.length - 4} lainnya
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section - Stats & Action */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {/* Stats */}
                  <div className="hidden sm:flex flex-col items-center space-y-1">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{classItem.total_students}</div>
                      <div className="text-xs text-gray-500">Siswa</div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-center space-y-1">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{classItem.assignments.length}</div>
                      <div className="text-xs text-gray-500">Mapel</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center space-x-2 text-sm text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors">
                    <span>Lihat Detail</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              </div>

              {/* Mobile Subjects - Show on small screens */}
              <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Mata Pelajaran</h4>
                <div className="flex flex-wrap gap-2">
                  {classItem.assignments.slice(0, 3).map((assignment, assignmentIndex) => (
                    <div key={assignmentIndex} className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                      <BookOpen className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">
                        {assignment.name}
                      </span>
                    </div>
                  ))}
                  {classItem.assignments.length > 3 && (
                    <div className="px-3 py-1 bg-gray-100 rounded-full">
                      <span className="text-xs text-gray-600">
                        +{classItem.assignments.length - 3} lainnya
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {isStudentDetailModalOpen && selectedStudentForModal && (
        <StudentDetailModal
          student={selectedStudentForModal}
          isOpen={isStudentDetailModalOpen}
          onClose={handleCloseStudentDetailModal}
        />
      )}
    </div>
  );
};

export default TeacherClassesPage;