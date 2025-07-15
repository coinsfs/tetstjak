import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentGrowth } from '../../types/dashboard';

interface StudentGrowthChartProps {
  data: StudentGrowth[];
}

const StudentGrowthChart: React.FC<StudentGrowthChartProps> = ({ data }) => {
  // Filter out data with student_count = 0 to avoid flat/empty years
  const filteredData = React.useMemo(() => {
    return data.filter(item => item.student_count > 0);
  }, [data]);

  // Calculate suggested max for Y axis with some margin
  const maxStudentCount = React.useMemo(() => {
    if (filteredData.length === 0) return 10;
    const max = Math.max(...filteredData.map(item => item.student_count));
    return Math.ceil(max * 1.2); // Add 20% margin
  }, [filteredData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Tahun: {label}
          </p>
          <p className="text-sm text-blue-600 font-semibold">
            Jumlah Siswa: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Show loading state if no data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pertumbuhan Siswa per Tahun
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

  // Show message if all data is filtered out (all zeros)
  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pertumbuhan Siswa per Tahun
        </h3>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Belum ada data pertumbuhan siswa</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate growth statistics
  const totalGrowth = filteredData.length > 1 
    ? filteredData[filteredData.length - 1].student_count - filteredData[0].student_count 
    : 0;
  
  const currentYear = filteredData[filteredData.length - 1];
  const previousYear = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;
  const yearlyGrowth = previousYear 
    ? currentYear.student_count - previousYear.student_count 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Pertumbuhan Siswa per Tahun
          </h3>
          <p className="text-sm text-gray-600">
            Data dari {filteredData[0]?.year} - {filteredData[filteredData.length - 1]?.year}
          </p>
        </div>
        
        {/* Growth Statistics */}
        <div className="flex space-x-4 mt-3 sm:mt-0">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Pertumbuhan</p>
            <p className={`text-sm font-semibold ${totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGrowth >= 0 ? '+' : ''}{totalGrowth}
            </p>
          </div>
          {previousYear && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Pertumbuhan Tahun Ini</p>
              <p className={`text-sm font-semibold ${yearlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yearlyGrowth >= 0 ? '+' : ''}{yearlyGrowth}
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs text-gray-500">Siswa Saat Ini</p>
            <p className="text-sm font-semibold text-blue-600">
              {currentYear?.student_count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f1f5f9" 
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              dataKey="year" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={10}
              domain={[0, maxStudentCount]}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="student_count" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ 
                fill: '#3B82F6', 
                strokeWidth: 2, 
                r: 6,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: 8, 
                fill: '#3B82F6',
                stroke: '#ffffff',
                strokeWidth: 3
              }}
              connectNulls={false}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Year Range Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 justify-center">
          {filteredData.map((item, index) => (
            <div 
              key={item.year}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                index === filteredData.length - 1 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {item.year}: {item.student_count} siswa
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentGrowthChart;