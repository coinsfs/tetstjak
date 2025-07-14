import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StudentCountByMajor } from '../../types/dashboard';

interface StudentsByMajorChartProps {
  data: StudentCountByMajor[];
}

const StudentsByMajorChart: React.FC<StudentsByMajorChartProps> = ({ data }) => {
  // Transform data for the chart
  const chartData = [
    {
      grade: 'Kelas 10',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.major_abbreviation]: item.grade_10_count
      }), {})
    },
    {
      grade: 'Kelas 11',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.major_abbreviation]: item.grade_11_count
      }), {})
    },
    {
      grade: 'Kelas 12',
      ...data.reduce((acc, item) => ({
        ...acc,
        [item.major_abbreviation]: item.grade_12_count
      }), {})
    }
  ];

  // Colors for different majors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Jumlah Siswa Berdasarkan Jurusan & Kelas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="grade" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.map((major, index) => (
            <Bar
              key={major.major_abbreviation}
              dataKey={major.major_abbreviation}
              stackId="a"
              fill={colors[index % colors.length]}
              name={major.major_name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentsByMajorChart;