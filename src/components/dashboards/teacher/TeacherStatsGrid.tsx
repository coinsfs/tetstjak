import React from 'react';
import { BookOpen, Users, FileText, HelpCircle } from 'lucide-react';
import { TeacherDashboardStats } from '@/types/dashboard';

interface StatItem {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface TeacherStatsGridProps {
  stats?: TeacherDashboardStats;
  loading?: boolean;
}

const TeacherStatsGrid: React.FC<TeacherStatsGridProps> = ({ stats, loading = false }) => {
  const getStatsItems = (): StatItem[] => {
    if (!stats) {
      return [
        { title: 'Kelas Mengajar', value: '0', icon: BookOpen, color: 'bg-blue-500' },
        { title: 'Total Siswa', value: '0', icon: Users, color: 'bg-green-500' },
        { title: 'Total Ujian', value: '0', icon: FileText, color: 'bg-purple-500' },
        { title: 'Soal Dibuat', value: '0', icon: HelpCircle, color: 'bg-orange-500' },
      ];
    }

    return [
      { title: 'Kelas Mengajar', value: stats.total_classes.toString(), icon: BookOpen, color: 'bg-blue-500' },
      { title: 'Total Siswa', value: stats.total_students.toString(), icon: Users, color: 'bg-green-500' },
      { title: 'Total Ujian Dibuat', value: stats.total_exams.toString(), icon: FileText, color: 'bg-purple-500' },
      { title: 'Total Soal Dibuat', value: stats.total_questions.toString(), icon: HelpCircle, color: 'bg-orange-500' },
    ];
  };

  const statsItems = getStatsItems();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {statsItems.map((stat, index) => (
        <div
          key={index}
          className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105 ${
            loading ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherStatsGrid;