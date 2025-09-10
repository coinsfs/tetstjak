import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, User, Users } from 'lucide-react';

interface TrendPoint {
  exam_date: string;
  student_score?: number;
  class_average?: number;
}

interface PerformanceTrendChartProps {
  studentTrend: Array<{ exam_date: string; score: number; }>;
  classTrend: Array<{ exam_date: string; average_score: number; }>;
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ 
  studentTrend, 
  classTrend 
}) => {
  // Sort trends by date to ensure proper chronological order
  const sortedStudentTrend = React.useMemo(() => 
    studentTrend.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()),
    [studentTrend]
  );
  
  const sortedClassTrend = React.useMemo(() => 
    classTrend.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()),
    [classTrend]
  );
  // Combine and process data
  const chartData = React.useMemo(() => {
    const dataMap = new Map<string, TrendPoint>();
    
    // Add student scores
    sortedStudentTrend.forEach(point => {
      // Use the original date string as key to preserve unique data points
      // But ensure we handle timezone properly for display
      let utcString = point.exam_date;
      if (!utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
        utcString = point.exam_date + 'Z';
      }
      
      // Use full datetime string as key to avoid grouping different exams
      const dateKey = new Date(utcString).toISOString();
      
      dataMap.set(dateKey, {
        exam_date: dateKey,
        student_score: point.score
      });
    });
    
    // Add class averages
    sortedClassTrend.forEach(point => {
      // Use the original date string as key to preserve unique data points
      let utcString = point.exam_date;
      if (!utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
        utcString = point.exam_date + 'Z';
      }
      
      // Use full datetime string as key to avoid grouping different exams
      const dateKey = new Date(utcString).toISOString();
      
      const existing = dataMap.get(dateKey) || { exam_date: dateKey };
      dataMap.set(dateKey, {
        ...existing,
        class_average: point.average_score
      });
    });
    
    // Convert to array and sort by date
    return Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );
  }, [sortedStudentTrend, sortedClassTrend]);

  // Calculate statistics
  const latestStudent = sortedStudentTrend[sortedStudentTrend.length - 1];
  const latestClass = sortedClassTrend[sortedClassTrend.length - 1];
  
  // Calculate trend from the last two exams (most recent change)
  const studentTrend_calc = sortedStudentTrend.length > 1 
    ? sortedStudentTrend[sortedStudentTrend.length - 1].score - sortedStudentTrend[sortedStudentTrend.length - 2].score
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {(() => {
              // Convert UTC to WIB for display
              let utcString = label;
              if (!utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
                utcString = label + 'Z';
              }
              return new Date(utcString).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Jakarta'
              });
            })()} WIB
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{Number(entry.value).toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!sortedStudentTrend.length && !sortedClassTrend.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <TrendingUp className="w-6 h-6 text-gray-300 mx-auto mb-2" />
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
              <p className="text-xs text-blue-600 font-medium">Nilai Terbaru</p>
              <p className="text-sm font-bold text-blue-700">
                {latestStudent ? Number(latestStudent.score).toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-100 rounded">
              <Users className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Rata-rata Kelas</p>
              <p className="text-sm font-bold text-green-700">
                {latestClass ? Number(latestClass.average_score).toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 rounded">
              {studentTrend_calc >= 0 ? (
                <TrendingUp className="w-3 h-3 text-purple-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-purple-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Tren</p>
              <p className={`text-sm font-bold ${studentTrend_calc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {studentTrend_calc >= 0 ? '+' : ''}{Number(studentTrend_calc).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart - Compact */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="exam_date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickFormatter={(date) => {
                  // Convert UTC to WIB for display
                  let utcString = date;
                  if (!utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
                    utcString = date + 'Z';
                  }
                  return new Date(utcString).toLocaleDateString('id-ID', { 
                    month: 'short', 
                    day: 'numeric',
                    timeZone: 'Asia/Jakarta'
                  });
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                domain={[0, 100]}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Line 
                type="monotone" 
                dataKey="student_score" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Nilai Anda"
                dot={{ fill: '#3B82F6', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, fill: '#3B82F6' }}
                connectNulls={true}
              />
              <Line 
                type="monotone" 
                dataKey="class_average" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Rata-rata Kelas"
                dot={{ fill: '#10B981', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, fill: '#10B981' }}
                connectNulls={true}
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrendChart;