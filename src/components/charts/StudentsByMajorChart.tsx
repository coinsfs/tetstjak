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
import { StudentCountByMajor } from '../../types/dashboard';

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
  // Define consistent colors for each major
  const majorColors: { [key: string]: string } = {
    'TKJ': '#3B82F6',    // Blue
    'TBSM': '#10B981',   // Green
    'TP': '#F59E0B',     // Orange
    'TKR': '#EF4444',    // Red
  };

  // Transform data for grouped bar chart
  const chartData = React.useMemo(() => {
    const grades = ['Kelas 10', 'Kelas 11', 'Kelas 12'];
    
    // Create datasets for each major
    const datasets = data.map((major) => ({
      label: major.major_abbreviation,
      data: [
        major.grade_10_count,
        major.grade_11_count,
        major.grade_12_count,
      ],
      backgroundColor: majorColors[major.major_abbreviation] || '#6B7280',
      borderColor: majorColors[major.major_abbreviation] || '#6B7280',
      borderWidth: 1,
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
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
          color: '#374151',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return `${context[0].label}`;
          },
          label: (context) => {
            const majorName = context.dataset.label;
            const count = context.parsed.y;
            return `${majorName}: ${count} siswa`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: '500',
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
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
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
    elements: {
      bar: {
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 0,
          bottomRight: 0,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  // Show loading state if no data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Jumlah Siswa Berdasarkan Jurusan & Kelas
        </h3>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for summary
  const totalStudents = data.reduce((sum, major) => 
    sum + major.grade_10_count + major.grade_11_count + major.grade_12_count, 0
  );

  const gradeTotals = {
    grade_10: data.reduce((sum, major) => sum + major.grade_10_count, 0),
    grade_11: data.reduce((sum, major) => sum + major.grade_11_count, 0),
    grade_12: data.reduce((sum, major) => sum + major.grade_12_count, 0),
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Jumlah Siswa Berdasarkan Jurusan & Kelas
          </h3>
          <p className="text-sm text-gray-600">
            Total {totalStudents.toLocaleString()} siswa aktif
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="flex space-x-4 mt-3 sm:mt-0">
          <div className="text-center">
            <p className="text-xs text-gray-500">Kelas 10</p>
            <p className="text-sm font-semibold text-blue-600">{gradeTotals.grade_10}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Kelas 11</p>
            <p className="text-sm font-semibold text-green-600">{gradeTotals.grade_11}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Kelas 12</p>
            <p className="text-sm font-semibold text-orange-600">{gradeTotals.grade_12}</p>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80">
        <Bar data={chartData} options={options} />
      </div>

      {/* Major Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.map((major) => {
            const total = major.grade_10_count + major.grade_11_count + major.grade_12_count;
            const percentage = totalStudents > 0 ? ((total / totalStudents) * 100).toFixed(1) : '0';
            
            return (
              <div key={major.major_abbreviation} className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: majorColors[major.major_abbreviation] || '#6B7280' }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">
                    {major.major_abbreviation}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">{percentage}% dari total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentsByMajorChart;