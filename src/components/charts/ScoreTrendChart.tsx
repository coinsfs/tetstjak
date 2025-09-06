import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ScoreTrendSeries } from '@/types/scoreTrendAnalytics';

interface ScoreTrendChartProps {
  data: ScoreTrendSeries[];
  title?: string;
  height?: number;
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ 
  data, 
  title = 'Tren Nilai Ujian', 
  height = 400 
}) => {
  // Generate unique colors for each series
  const generateColor = (index: number) => {
    const colors = [
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple (repeat if needed)
      '#06b6d4', // cyan (repeat if needed)
    ];
    return colors[index % colors.length];
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!data || data.length === 0) return [];
    
    // Get all unique dates
    const allDates: string[] = [];
    data.forEach(series => {
      series.data.forEach(point => {
        if (!allDates.includes(point.date)) {
          allDates.push(point.date);
        }
      });
    });
    
    // Sort dates
    allDates.sort();
    
    // Create chart data structure
    const chartData: any[] = allDates.map(date => {
      const dataPoint: any = { date: new Date(date).toLocaleDateString('id-ID') };
      data.forEach(series => {
        const point = series.data.find(p => p.date === date);
        dataPoint[series.label] = point ? point.score : null;
      });
      return dataPoint;
    });
    
    return chartData;
  };

  // Prepare series for the chart
  const prepareSeries = () => {
    if (!data || data.length === 0) return [];
    
    return data.map((series, index) => ({
      name: series.label,
      dataKey: series.label,
      color: generateColor(index),
      studentCount: series.metadata?.student_count || 0
    }));
  };

  const chartData = prepareChartData();
  const series = prepareSeries();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Find the original series data to get additional info
            const originalSeries = data.find(s => s.label === entry.name);
            const originalPoint = originalSeries?.data.find(p => 
              new Date(p.date).toLocaleDateString('id-ID') === label
            );
            
            return (
              <div key={index} className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">{entry.value}</span>
                  {originalPoint && (
                    <p className="text-xs text-gray-500">
                      {originalPoint.exam_title}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-2">Tidak ada data tren nilai</div>
          <p className="text-sm text-gray-500">Data akan muncul setelah ujian dilakukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}
      
      <div className="h-64 md:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            {series.map((s, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                dot={{ 
                  fill: s.color, 
                  strokeWidth: 2, 
                  r: 4,
                  stroke: '#ffffff'
                }}
                activeDot={{ 
                  r: 6, 
                  fill: s.color,
                  stroke: '#ffffff',
                  strokeWidth: 2
                }}
                name={s.name}
                connectNulls={false}
                animationDuration={800}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {series.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {series.map((s, index) => (
            <div 
              key={index} 
              className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-xs"
            >
              <div 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: s.color }}
              ></div>
              <span className="text-gray-700">{s.name}</span>
              {s.studentCount > 0 && (
                <span className="ml-1 text-gray-500">({s.studentCount} siswa)</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreTrendChart;