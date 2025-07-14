import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BrowserUsage } from '../../types/dashboard';

interface BrowserUsageChartProps {
  data: BrowserUsage[];
}

const BrowserUsageChart: React.FC<BrowserUsageChartProps> = ({ data }) => {
  // Process data to show max 5 browsers, group others as "Lainnya"
  const processedData = React.useMemo(() => {
    if (data.length <= 5) {
      return data;
    }

    const topFive = data.slice(0, 5);
    const others = data.slice(5);
    const othersTotal = others.reduce((sum, item) => sum + item.count, 0);
    const othersPercentage = others.reduce((sum, item) => sum + item.percentage, 0);

    return [
      ...topFive,
      {
        browser_name: 'Lainnya',
        count: othersTotal,
        percentage: othersPercentage
      }
    ];
  }, [data]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Browser yang Digunakan
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, 'Pengguna']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BrowserUsageChart;