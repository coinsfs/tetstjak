import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Play, CheckCircle, AlertCircle, ArrowRight, Eye } from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { teacherExamService, TeacherExam } from '@/services/teacherExam';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import TeacherInfoCard from './TeacherInfoCard';
import toast from 'react-hot-toast';

interface TeacherWelcomeCardProps {
  user: UserProfile | null;
}

const TeacherWelcomeCard: React.FC<TeacherWelcomeCardProps> = ({ user }) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [upcomingExams, setUpcomingExams] = useState<TeacherExam[]>([]);
  const [completedExams, setCompletedExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // Fetch upcoming/ongoing exams (not completed)
        const upcomingResponse = await teacherExamService.getTeacherExams(token, {
          limit: 3,
          status_ne: 'completed'
        });
        
        // Fetch completed exams
        const completedResponse = await teacherExamService.getTeacherExams(token, {
          limit: 3,
          status: 'completed'
        });

        setUpcomingExams(upcomingResponse.data);
        setCompletedExams(completedResponse.data);
      } catch (error) {
        console.error('Error fetching exams:', error);
        toast.error('Gagal memuat daftar ujian');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [token]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_questions: {
        label: 'Menunggu Soal',
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle,
      },
      ready: {
        label: 'Siap',
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
      },
      ongoing: {
        label: 'Berlangsung',
        color: 'bg-green-100 text-green-800',
        icon: Play,
      },
      completed: {
        label: 'Selesai',
        color: 'bg-purple-100 text-purple-800',
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_questions;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getExamTypeLabel = (examType: string) => {
    const typeLabels: { [key: string]: string } = {
      quiz: 'Kuis',
      daily_test: 'Ulangan Harian',
      official_uts: 'UTS',
      official_uas: 'UAS',
    };
    return typeLabels[examType] || examType;
  };

  const handleViewAllExams = () => {
    navigate('/teacher/exams');
  };

  const ExamCard: React.FC<{ exam: TeacherExam }> = ({ exam }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 mr-2">
          {exam.title}
        </h4>
        {getStatusBadge(exam.status)}
      </div>
      
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center">
          <BookOpen className="w-3 h-3 mr-1" />
          <span>{getExamTypeLabel(exam.exam_type)}</span>
        </div>
        
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{formatDateTimeWithTimezone(exam.availability_start_time)}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>{exam.duration_minutes} menit</span>
        </div>
        
        <div className="text-xs text-gray-500">
          {exam.question_ids.length} soal
        </div>
      </div>
    </div>
  );

  const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="text-center py-6">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <BookOpen className="h-6 w-6 text-gray-400" />
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <TeacherInfoCard user={user} title="Aktivitas Mengajar">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Memuat ujian...</span>
        </div>
      </TeacherInfoCard>
    );
  }

  return (
    <TeacherInfoCard user={user} title="Aktivitas Mengajar">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming/Ongoing Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-600" />
              Ujian Mendatang
            </h3>
            <span className="text-sm text-gray-500">
              {upcomingExams.length} ujian
            </span>
          </div>
          
          <div className="space-y-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => (
                <ExamCard key={exam._id} exam={exam} />
              ))
            ) : (
              <EmptyState 
                title="Tidak ada ujian mendatang"
                description="Semua ujian sudah selesai atau belum ada ujian yang dijadwalkan"
              />
            )}
          </div>
          
          <button
            onClick={handleViewAllExams}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Semua Ujian
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Completed Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Ujian Selesai
            </h3>
            <span className="text-sm text-gray-500">
              {completedExams.length} ujian
            </span>
          </div>
          
          <div className="space-y-3">
            {completedExams.length > 0 ? (
              completedExams.map((exam) => (
                <ExamCard key={exam._id} exam={exam} />
              ))
            ) : (
              <EmptyState 
                title="Belum ada ujian selesai"
                description="Ujian yang sudah selesai akan muncul di sini"
              />
            )}
          </div>
          
          <button
            onClick={handleViewAllExams}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Riwayat Ujian
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </TeacherInfoCard>
  );
};

export default TeacherWelcomeCard;