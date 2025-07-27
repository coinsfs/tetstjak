import React from 'react';
import { BookOpen, Users, Calendar, CheckCircle } from 'lucide-react';

interface StatItem {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface TeacherStatsGridProps {
  stats?: StatItem[];
}

const TeacherStatsGrid: React.FC<TeacherStatsGridProps> = ({ stats }) => {
  const defaultStats: StatItem[] = [
    { title: 'Kelas Mengajar', value: '5', icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Total Siswa', value: '156', icon: Users, color: 'bg-green-500' },
    { title: 'Jadwal Hari Ini', value: '6', icon: Calendar, color: 'bg-purple-500' },
    { title: 'Tugas Dinilai', value: '23', icon: CheckCircle, color: 'bg-orange-500' },
  ];

  const statsToShow = stats || defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {statsToShow.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherStatsGrid;