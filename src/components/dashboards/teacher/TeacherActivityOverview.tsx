import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Users, 
  TrendingUp,
  Eye,
  Edit,
  Play,
  FileText,
  Award,
  Target,
  Activity,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';

// Dummy data interfaces
interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  class: string;
  type: 'quiz' | 'daily_test' | 'official_uts' | 'official_uas';
  status: 'upcoming' | 'ongoing' | 'completed' | 'pending_questions';
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  participantCount: number;
  completedCount?: number;
}

interface GradingTask {
  id: string;
  examTitle: string;
  subject: string;
  class: string;
  totalSubmissions: number;
  gradedCount: number;
  pendingCount: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface QuestionActivity {
  id: string;
  title: string;
  subject: string;
  type: 'created' | 'submitted' | 'approved' | 'rejected';
  date: string;
  questionCount: number;
  status: 'pending' | 'approved' | 'rejected';
}

const TeacherActivityOverview: React.FC = () => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'exams' | 'grading' | 'questions'>('exams');

  // Dummy data
  const examSummary: ExamSummary[] = [
    {
      id: '1',
      title: 'Kuis Matematika Bab 5',
      subject: 'Matematika',
      class: 'X IPA 1',
      type: 'quiz',
      status: 'upcoming',
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T09:30:00Z',
      duration: 90,
      totalQuestions: 20,
      participantCount: 32
    },
    {
      id: '2',
      title: 'Ulangan Harian Fisika',
      subject: 'Fisika',
      class: 'XI IPA 2',
      type: 'daily_test',
      status: 'ongoing',
      startTime: '2024-01-14T10:00:00Z',
      endTime: '2024-01-14T12:00:00Z',
      duration: 120,
      totalQuestions: 25,
      participantCount: 28,
      completedCount: 15
    },
    {
      id: '3',
      title: 'UTS Kimia Semester 1',
      subject: 'Kimia',
      class: 'XII IPA 1',
      type: 'official_uts',
      status: 'completed',
      startTime: '2024-01-12T08:00:00Z',
      endTime: '2024-01-12T10:00:00Z',
      duration: 120,
      totalQuestions: 30,
      participantCount: 30,
      completedCount: 30
    },
    {
      id: '4',
      title: 'Kuis Biologi Bab 3',
      subject: 'Biologi',
      class: 'X IPA 2',
      type: 'quiz',
      status: 'pending_questions',
      startTime: '2024-01-16T13:00:00Z',
      endTime: '2024-01-16T14:30:00Z',
      duration: 90,
      totalQuestions: 0,
      participantCount: 29
    }
  ];

  const gradingTasks: GradingTask[] = [
    {
      id: '1',
      examTitle: 'UTS Kimia Semester 1',
      subject: 'Kimia',
      class: 'XII IPA 1',
      totalSubmissions: 30,
      gradedCount: 18,
      pendingCount: 12,
      dueDate: '2024-01-20T23:59:59Z',
      priority: 'high'
    },
    {
      id: '2',
      examTitle: 'Ulangan Harian Fisika',
      subject: 'Fisika',
      class: 'XI IPA 2',
      totalSubmissions: 28,
      gradedCount: 5,
      pendingCount: 23,
      dueDate: '2024-01-18T23:59:59Z',
      priority: 'medium'
    },
    {
      id: '3',
      examTitle: 'Kuis Matematika Bab 4',
      subject: 'Matematika',
      class: 'X IPA 1',
      totalSubmissions: 32,
      gradedCount: 32,
      pendingCount: 0,
      dueDate: '2024-01-15T23:59:59Z',
      priority: 'low'
    }
  ];

  const questionActivities: QuestionActivity[] = [
    {
      id: '1',
      title: 'Bank Soal Matematika Trigonometri',
      subject: 'Matematika',
      type: 'created',
      date: '2024-01-14T10:30:00Z',
      questionCount: 15,
      status: 'pending'
    },
    {
      id: '2',
      title: 'Soal Fisika Gerak Lurus',
      subject: 'Fisika',
      type: 'submitted',
      date: '2024-01-13T14:20:00Z',
      questionCount: 20,
      status: 'approved'
    },
    {
      id: '3',
      title: 'Bank Soal Kimia Asam Basa',
      subject: 'Kimia',
      type: 'approved',
      date: '2024-01-12T09:15:00Z',
      questionCount: 25,
      status: 'approved'
    },
    {
      id: '4',
      title: 'Soal Biologi Sel',
      subject: 'Biologi',
      type: 'rejected',
      date: '2024-01-11T16:45:00Z',
      questionCount: 12,
      status: 'rejected'
    }
  ];

  const getExamTypeLabel = (type: string) => {
    const labels = {
      quiz: 'Kuis',
      daily_test: 'Ulangan Harian',
      official_uts: 'UTS',
      official_uas: 'UAS'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      upcoming: { label: 'Akan Datang', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      ongoing: { label: 'Berlangsung', color: 'bg-green-100 text-green-800', icon: Play },
      completed: { label: 'Selesai', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      pending_questions: { label: 'Menunggu Soal', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    };
    
    const config = configs[status as keyof typeof configs] || configs.upcoming;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons = {
      created: BookOpen,
      submitted: FileText,
      approved: CheckCircle,
      rejected: AlertCircle
    };
    return icons[type as keyof typeof icons] || BookOpen;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'exams', label: 'Ringkasan Ujian', icon: Calendar, count: examSummary.length },
    { id: 'grading', label: 'Status Penilaian', icon: Award, count: gradingTasks.filter(t => t.pendingCount > 0).length },
    { id: 'questions', label: 'Aktivitas Soal', icon: BookOpen, count: questionActivities.length }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Aktivitas Mengajar</h2>
              <p className="text-sm text-gray-600">Pantau aktivitas pengajaran Anda</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/teacher/classes')}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            {examSummary.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada ujian yang dijadwalkan</p>
              </div>
            ) : (
              examSummary.map((exam) => (
                <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                        {getStatusBadge(exam.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{exam.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{exam.class}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{exam.duration} menit</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>{exam.totalQuestions} soal</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Jadwal:</span> {formatDateTime(exam.startTime)} - {formatDateTime(exam.endTime)}
                        </div>
                        
                        {exam.status === 'ongoing' && exam.completedCount !== undefined && (
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(exam.completedCount / exam.participantCount) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {exam.completedCount}/{exam.participantCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {exam.status === 'ongoing' && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Monitor Ujian">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {exam.status === 'completed' && (
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Lihat Hasil">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      {(exam.status === 'upcoming' || exam.status === 'pending_questions') && (
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Ujian">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Grading Tab */}
        {activeTab === 'grading' && (
          <div className="space-y-4">
            {gradingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada tugas penilaian</p>
              </div>
            ) : (
              gradingTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{task.examTitle}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          <Target className="w-3 h-3 mr-1" />
                          {task.priority === 'high' ? 'Prioritas Tinggi' : task.priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{task.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{task.class}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {formatDate(task.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(task.gradedCount / task.totalSubmissions) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {task.gradedCount}/{task.totalSubmissions}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {task.pendingCount > 0 ? `${task.pendingCount} belum dinilai` : 'Semua sudah dinilai'}
                          </span>
                        </div>
                        
                        {task.pendingCount > 0 && (
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Mulai Menilai
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questionActivities.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada aktivitas soal</p>
              </div>
            ) : (
              questionActivities.map((activity) => {
                const IconComponent = getQuestionTypeIcon(activity.type);
                return (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === 'approved' ? 'bg-green-100' :
                          activity.type === 'rejected' ? 'bg-red-100' :
                          activity.type === 'submitted' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            activity.type === 'approved' ? 'text-green-600' :
                            activity.type === 'rejected' ? 'text-red-600' :
                            activity.type === 'submitted' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                              activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.status === 'approved' ? 'Disetujui' :
                               activity.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="w-4 h-4" />
                              <span>{activity.subject}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>{activity.questionCount} soal</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{formatDateTime(activity.date)}</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <span className="font-medium">
                              {activity.type === 'created' ? 'Dibuat' :
                               activity.type === 'submitted' ? 'Disubmit untuk review' :
                               activity.type === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        {activity.status === 'pending' && (
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherActivityOverview;