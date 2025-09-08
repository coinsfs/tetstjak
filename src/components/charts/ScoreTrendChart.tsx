import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { ScoreTrendSeries } from '@/types/scoreTrendAnalytics';

interface ScoreTrendChartProps {
  data: ScoreTrendSeries[];
  height?: number;
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ 
  data,
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Find the original series data to get additional info
            const originalSeries = data.find(s => s.label === entry.name);
            const originalPoint = originalSeries?.data.find(p => 
              new Date(p.date).toLocaleDateString('id-ID') === label
            );
            
            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{entry.name}:</span>
                </div>
                <span className="font-semibold text-gray-900">{Number(entry.value).toFixed(1)}</span>
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
    <div className="bg-white rounded border border-gray-200 p-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              domain={[0, 100]}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconSize={8} 
              wrapperStyle={{ fontSize: '11px' }}
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
                  strokeWidth: 1, 
                  r: 3
                }}
                activeDot={{ 
                  r: 5, 
                  fill: s.color
                }}
                name={s.name}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreTrendChart;