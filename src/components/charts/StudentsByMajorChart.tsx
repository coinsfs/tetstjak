import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { StudentCountByMajor } from '@/types/dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StudentsByMajorChartProps {
  data: StudentCountByMajor[];
}

const StudentsByMajorChart: React.FC<StudentsByMajorChartProps> = ({ data }) => {
  const majorColors: { [key: string]: string } = {
    'TKJ': '#3B82F6',
    'TBSM': '#10B981',
    'TP': '#F59E0B',
    'TKR': '#EF4444',
  };

  const chartData = React.useMemo(() => {
    const grades = ['Grade 10', 'Grade 11', 'Grade 12'];
    
    const datasets = data.map((major) => ({
      label: major.major_abbreviation,
      data: [
        major.grade_10_count,
        major.grade_11_count,
        major.grade_12_count,
      ],
      backgroundColor: majorColors[major.major_abbreviation] || '#64748B',
      borderRadius: 4,
      borderSkipped: false,
    }));

    return {
      labels: grades,
      datasets,
    };
  }, [data]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 16,
          font: {
            size: 12,
            weight: 500,
          },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 8,
        titleFont: {
          size: 12,
          weight: 600,
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: (context) => {
            const majorName = context.dataset.label;
            const count = context.parsed.y;
            return `${majorName}: ${count} students`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 500,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          },
        },
        border: {
          display: false,
        },
      },
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading data...</span>
        </div>
      </div>
    );
  }

  const totalStudents = data.reduce((sum, major) => 
    sum + major.grade_10_count + major.grade_11_count + major.grade_12_count, 0
  );

  return (
    <div className="space-y-4">
      {/* Compact Summary */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500">Total Active Students</span>
          <div className="text-lg font-semibold text-gray-900">{totalStudents.toLocaleString()}</div>
        </div>
        
        <div className="flex space-x-4">
          {['Grade 10', 'Grade 11', 'Grade 12'].map((grade, index) => {
            const total = data.reduce((sum, major) => {
              if (index === 0) return sum + major.grade_10_count;
              if (index === 1) return sum + major.grade_11_count;
              return sum + major.grade_12_count;
            }, 0);
            
            return (
              <div key={grade} className="text-center">
                <div className="text-xs text-gray-500">{grade}</div>
                <div className="text-sm font-semibold text-gray-900">{total}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <Bar data={chartData} options={options} />
      </div>

      {/* Major Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
        {data.map((major) => {
          const total = major.grade_10_count + major.grade_11_count + major.grade_12_count;
          const percentage = totalStudents > 0 ? ((total / totalStudents) * 100).toFixed(1) : '0';
          
          return (
            <div key={major.major_abbreviation} className="text-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-center mb-1">
                <div 
                  className="w-2.5 h-2.5 rounded-full mr-1.5"
                  style={{ backgroundColor: majorColors[major.major_abbreviation] || '#64748B' }}
                ></div>
                <span className="text-sm font-medium text-gray-900">
                  {major.major_abbreviation}
                </span>
              </div>
              <div className="text-base font-semibold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentsByMajorChart;