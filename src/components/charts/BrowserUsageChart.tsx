import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BrowserUsage } from '@/types/dashboard';
import { Globe } from 'lucide-react';

interface BrowserUsageChartProps {
  data: BrowserUsage[];
}

const BrowserUsageChart: React.FC<BrowserUsageChartProps> = ({ data }) => {
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
      'Chrome Mobile': '#34A853',
      'Lainnya': '#6B7280'
    };
    
    return browserColors[browserName] || `hsl(${Math.abs(browserName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`;
  };

  // Process data for chart (top 5 + others)
  const chartData = React.useMemo(() => {
    if (data.length <= 5) {
      return data.map(item => ({
        ...item,
        color: getBrowserColor(item.browser_name)
      }));
    }

    const topFive = data.slice(0, 5);
    const others = data.slice(5);
    const othersTotal = others.length > 0 ? others.reduce((sum, item) => sum + item.count, 0) : 0;
    const othersPercentage = others.length > 0 ? others.reduce((sum, item) => sum + item.percentage, 0) : 0;

    const processedItems = topFive.map(item => ({
      ...item,
      color: getBrowserColor(item.browser_name)
    }));

    if (othersTotal > 0) {
      processedItems.push({
        browser_name: 'Lainnya',
        count: othersTotal,
        percentage: othersPercentage,
        color: getBrowserColor('Lainnya')
      });
    }

    return processedItems;
  }, [data]);

  // Process data for browser list (top 2 only)
  const browserListData = React.useMemo(() => {
    return data.slice(0, 2).map(item => ({
      ...item,
      color: getBrowserColor(item.browser_name)
    }));
  }, [data]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 8) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={10}
        fontWeight="600"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {`${Math.round(percentage)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-white mb-1">
            {data.browser_name}
          </p>
          <p className="text-sm text-blue-400">
            {data.count} users ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.slice(0, 4).map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-xs text-gray-600">
              {entry.payload.browser_name} ({Math.round(entry.payload.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    );
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

  const totalUsers = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500">Active Users</span>
          <div className="text-lg font-semibold text-gray-900">{totalUsers.toLocaleString()}</div>
        </div>
        
        {data.length > 0 && (
          <div className="flex items-center space-x-1.5">
            <Globe className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-500">
              Top: <span className="font-medium text-gray-900">{data[0].browser_name}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Browser List - Show only top 2 browsers */}
      {browserListData.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Top Browsers</span>
            <span className="text-xs text-gray-500">
              {data.length > 2 ? `+${data.length - 2} more` : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {browserListData.map((browser, index) => (
              <div key={browser.browser_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-1 rounded-full min-w-[24px] text-center">
                    #{index + 1}
                  </span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: browser.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">
                    {browser.browser_name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{browser.count}</div>
                  <div className="text-xs text-gray-500">{browser.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserUsageChart;