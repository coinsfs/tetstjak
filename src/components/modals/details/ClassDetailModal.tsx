import React, { useState, useEffect } from 'react';
import { X, School, User, Users, Calendar, BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { Class, ClassStudent } from '@/types/class';
import { classService } from '@/services/class';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileImageUrl } from '@/constants/config';
import toast from 'react-hot-toast';

interface ClassDetailModalProps {
  classData: Class;
  isOpen: boolean;
  onClose: () => void;
}

const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  classData,
  isOpen,
  onClose
}) => {
  const { token } = useAuth();
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!token || !isOpen) return;

      setLoadingStudents(true);
      try {
        const studentsData = await classService.getClassStudents(token, classData._id);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Gagal memuat data siswa');
      } finally {
        setLoadingStudents(false);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, token, classData._id]);

  if (!isOpen) return null;

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <School className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Kelas</h2>
              <p className="text-sm text-gray-500">
                {getGradeLabel(classData.grade_level)} {classData.expertise_details?.abbreviation} {classData.name}
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
          {/* Class Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informasi Kelas
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <School className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nama Kelas</p>
                    <p className="font-medium text-gray-900">
                      {getGradeLabel(classData.grade_level)} {classData.expertise_details?.abbreviation} {classData.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Jurusan</p>
                    <p className="font-medium text-gray-900">
                      {classData.expertise_details?.name || 'Tidak ada data'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {classData.expertise_details?.abbreviation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tahun Ajaran</p>
                    <p className="font-medium text-gray-900">{classData.academic_year}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Jumlah Siswa</p>
                    <p className="font-medium text-gray-900">{students.length} siswa</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Wali Kelas
              </h3>
              
              {classData.homeroom_teacher_details ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {classData.homeroom_teacher_details.profile_picture_url ? (
                      <img
                        src={getProfileImageUrl(classData.homeroom_teacher_details.profile_picture_url) || ''}
                        alt={classData.homeroom_teacher_details.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ${
                      classData.homeroom_teacher_details.profile_picture_url ? 'hidden' : ''
                    }`}>
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {classData.homeroom_teacher_details.full_name}
                      </p>
                      <p className="text-sm text-gray-500">NKTAM</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        Wali Kelas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        'bg-green-100 text-green-800'
                      }`}>
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada wali kelas</p>
                </div>
              )}
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Daftar Siswa
              </h3>
              {students.length > 0 && (
                <div className="text-sm text-gray-500">
                  Total: {students.length} siswa
                </div>
              )}
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
                  <span className="text-sm font-medium text-gray-700">Memuat data siswa...</span>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-1">Belum ada siswa di kelas ini</p>
                <p className="text-xs text-gray-400">Siswa akan muncul di sini setelah didaftarkan ke kelas</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student, index) => (
                    <div key={student._id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        {student.profile_details?.profile_picture_url ? (
                          <img
                            src={getProfileImageUrl(student.profile_details.profile_picture_url) || ''}
                            alt={student.profile_details.full_name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ${
                          student.profile_details?.profile_picture_url ? 'hidden' : ''
                        }`}>
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {student.profile_details?.full_name || 'Nama tidak tersedia'}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            NIS: {student.login_id}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail className="w-3 h-3 mr-1" />
                              <span className="truncate">{student.email}</span>
                            </div>
                            
                            {student.profile_details?.phone_number && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Phone className="w-3 h-3 mr-1" />
                                {student.profile_details.phone_number}
                              </div>
                            )}
                            
                            {student.profile_details?.birth_place && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="w-3 h-3 mr-1" />
                                {student.profile_details.birth_place}
                              </div>
                            )}
                          </div>

                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailModal;