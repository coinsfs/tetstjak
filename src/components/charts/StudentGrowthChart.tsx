import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentGrowth } from '@/types/dashboard';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StudentGrowthChartProps {
  data: StudentGrowth[];
}

const StudentGrowthChart: React.FC<StudentGrowthChartProps> = ({ data }) => {
  const filteredData = React.useMemo(() => {
    return data.filter(item => item.student_count > 0);
  }, [data]);

  const maxStudentCount = React.useMemo(() => {
    if (filteredData.length === 0) return 10;
    const max = Math.max(...filteredData.map(item => item.student_count));
    return Math.ceil(max * 1.2);
  }, [filteredData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-white mb-1">
            Year {label}
          </p>
          <p className="text-sm text-blue-400">
            Students: {data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
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

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">No growth data available</p>
          <p className="text-xs text-gray-400">Student growth data will appear here</p>
        </div>
      </div>
    );
  }

  const totalGrowth = filteredData.length > 1 
    ? filteredData[filteredData.length - 1].student_count - filteredData[0].student_count 
    : 0;
  
  const currentYear = filteredData[filteredData.length - 1];
  const previousYear = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;
  const yearlyGrowth = previousYear 
    ? currentYear.student_count - previousYear.student_count 
    : 0;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500">
            {filteredData[0]?.year} - {filteredData[filteredData.length - 1]?.year}
          </span>
          <div className="text-lg font-semibold text-gray-900">
            {currentYear?.student_count?.toLocaleString() || 0}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              {totalGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className={`text-sm font-semibold ${totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGrowth >= 0 ? '+' : ''}{totalGrowth}
            </div>
          </div>
          
          {previousYear && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {yearlyGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs text-gray-500">YoY</span>
              </div>
              <div className={`text-sm font-semibold ${yearlyGrowth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {yearlyGrowth >= 0 ? '+' : ''}{yearlyGrowth}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={filteredData} 
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              dataKey="year" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickMargin={8}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickMargin={8}
              domain={[0, maxStudentCount]}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="student_count" 
              stroke="#3B82F6" 
              strokeWidth={2}
              fill="#3B82F6"
              fillOpacity={0.1}
              dot={{ 
                fill: '#3B82F6', 
                strokeWidth: 2, 
                r: 4,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: 6, 
                fill: '#3B82F6',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              connectNulls={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Year Summary */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 justify-center">
          {filteredData.map((item, index) => (
            <div 
              key={item.year}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                index === filteredData.length - 1 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.year}: {item.student_count.toLocaleString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentGrowthChart;