import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BrowserUsage } from '../../types/dashboard';

interface BrowserUsageChartProps {
  data: BrowserUsage[];
}

const BrowserUsageChart: React.FC<BrowserUsageChartProps> = ({ data }) => {
  // Browser-specific colors (optional enhancement)
  const getBrowserColor = (browserName: string): string => {
    const browserColors: { [key: string]: string } = {
      'Chrome': '#4285F4',
      'Firefox': '#FF7139', 
      'Safari': '#00D4FF',
      'Edge': '#0078D4',
      'Opera': '#FF1B2D',
      'Internet Explorer': '#1EBBEE',
      'Samsung Internet': '#1428A0',
      'UC Browser': '#FF6900',
    };
    
    return browserColors[browserName] || `hsl(${Math.abs(browserName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`;
  };

  // Process data to show max 6 browsers, group others as "Lainnya"
  const processedData = React.useMemo(() => {
    if (data.length <= 6) {
      return data.map(item => ({
        ...item,
        color: getBrowserColor(item.browser_name)
      }));
    }

    const topSix = data.slice(0, 6);
    const others = data.slice(6);
    const othersTotal = others.reduce((sum, item) => sum + item.count, 0);
    const othersPercentage = others.reduce((sum, item) => sum + item.percentage, 0);

    const processedItems = topSix.map(item => ({
      ...item,
      color: getBrowserColor(item.browser_name)
    }));

    if (othersTotal > 0) {
      processedItems.push({
        browser_name: 'Lainnya',
        count: othersTotal,
        percentage: othersPercentage,
        color: '#6B7280'
      });
    }

    return processedItems;
  }, [data]);

  // Custom label renderer showing browser name and percentage
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, browser_name, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant enough (> 5%)
    if (percentage < 5) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={11}
        fontWeight="600"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {`${Math.round(percentage)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {data.browser_name}
          </p>
          <p className="text-sm text-blue-600 font-semibold">
            {data.count} pengguna ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-gray-700 font-medium">
              {entry.payload.browser_name} ({Math.round(entry.payload.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Show loading state if no data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Browser yang Digunakan
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

  // Calculate total users
  const totalUsers = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Browser yang Digunakan
          </h3>
          <p className="text-sm text-gray-600">
            Total {totalUsers.toLocaleString()} pengguna aktif
          </p>
        </div>
        
        {/* Top Browser */}
        {processedData.length > 0 && (
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: processedData[0].color }}
            ></div>
            <span className="text-sm text-gray-600">
              Terpopuler: <span className="font-semibold text-gray-900">{processedData[0].browser_name}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              animationBegin={0}
              animationDuration={1000}
            >
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Browser Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedData.slice(0, 6).map((browser, index) => (
            <div key={browser.browser_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: browser.color }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {browser.browser_name}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{browser.count}</p>
                <p className="text-xs text-gray-500">{browser.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowserUsageChart;