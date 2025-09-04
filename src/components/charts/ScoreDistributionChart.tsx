import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, User, Users } from 'lucide-react';

interface ScoreDistributionData {
  range: string;
  student_count: number;
  student_percentage: number;
  class_count: number;
  class_percentage: number;
}

interface ScoreDistributionChartProps {
  studentDistribution: Array<{ range: string; count: number; percentage: number; }>;
  classDistribution: Array<{ range: string; count: number; percentage: number; }>;
  studentHighestScore: number;
  classHighestScore: number;
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ 
  studentDistribution, 
  classDistribution,
  studentHighestScore,
  classHighestScore
}) => {
  // Combine data for comparison
  const chartData: ScoreDistributionData[] = React.useMemo(() => {
    const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    
    return ranges.map(range => {
      const studentData = studentDistribution.find(item => item.range === range);
      const classData = classDistribution.find(item => item.range === range);
      
      return {
        range,
        student_count: studentData?.count || 0,
        student_percentage: studentData?.percentage || 0,
        class_count: classData?.count || 0,
        class_percentage: classData?.percentage || 0
      };
    });
  }, [studentDistribution, classDistribution]);

  // Calculate total counts for context
  const totalStudentExams = studentDistribution.reduce((sum, item) => sum + item.count, 0);
  const totalClassExams = classDistribution.reduce((sum, item) => sum + item.count, 0);

  // Find student's dominant range
  const studentDominantRange = studentDistribution.reduce((prev, current) => 
    current.count > prev.count ? current : prev
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-48">
          <p className="text-sm font-medium text-gray-900 mb-3">Rentang Nilai: {label}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">Nilai Anda:</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{data.student_count} ujian</p>
                <p className="text-xs text-gray-500">{Number(data.student_percentage).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Kelas:</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{data.class_count} ujian</p>
                <p className="text-xs text-gray-500">{Number(data.class_percentage).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!studentDistribution.length && !classDistribution.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Belum Ada Data</p>
          <p className="text-xs text-gray-400">Data akan muncul setelah ujian</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Statistics - Compact */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <User className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Nilai Tertinggi Anda</p>
              <p className="text-sm font-bold text-blue-700">{Number(studentHighestScore).toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-100 rounded">
              <Users className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Nilai Tertinggi Kelas</p>
              <p className="text-sm font-bold text-green-700">{Number(classHighestScore).toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 rounded">
              <BarChart3 className="w-3 h-3 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Dominan</p>
              <p className="text-sm font-bold text-purple-700">{studentDominantRange?.range || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Chart - Compact */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                label={{ value: 'Persentase (%)', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar 
                dataKey="student_percentage" 
                name="Nilai Anda (%)"
                fill="#3B82F6"
                radius={[1, 1, 0, 0]}
                maxBarSize={30}
              />
              <Bar 
                dataKey="class_percentage" 
                name="Rata-rata Kelas (%)"
                fill="#10B981"
                radius={[1, 1, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown - Responsive */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-900 mb-2">Rincian Distribusi</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {chartData.map((item) => (
            <div key={item.range} className="bg-white rounded p-2 border border-gray-200">
              <h5 className="text-xs font-medium text-gray-900 mb-1">{item.range}</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Anda:</span>
                  <span className="font-medium">{Number(item.student_percentage).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Kelas:</span>
                  <span className="font-medium">{Number(item.class_percentage).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreDistributionChart;