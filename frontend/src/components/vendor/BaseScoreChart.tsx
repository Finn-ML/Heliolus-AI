// Epic 13 - Story 13.2: Base Score Breakdown Chart Component
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BaseScore } from '@/types/vendor-matching.types';

interface BaseScoreChartProps {
  baseScore: BaseScore;
}

export const BaseScoreChart: React.FC<BaseScoreChartProps> = ({ baseScore }) => {
  const data = [
    {
      name: 'Risk Coverage',
      value: baseScore.riskAreaCoverage,
      max: 40,
      color: '#3b82f6', // blue-500
    },
    {
      name: 'Size Fit',
      value: baseScore.sizeFit,
      max: 20,
      color: '#10b981', // green-500
    },
    {
      name: 'Geo Coverage',
      value: baseScore.geoCoverage,
      max: 20,
      color: '#a855f7', // purple-500
    },
    {
      name: 'Price Score',
      value: baseScore.priceScore,
      max: 20,
      color: '#eab308', // yellow-500
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-semibold mb-1">{data.name}</p>
          <p className="text-gray-300">
            Score: <span className="text-cyan-400 font-bold">{data.value}</span> / {data.max}
          </p>
          <p className="text-gray-400 text-sm">
            {((data.value / data.max) * 100).toFixed(0)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-1">Base Score Breakdown</h4>
        <p className="text-2xl font-bold text-white">
          {baseScore.totalBase}
          <span className="text-gray-500 text-lg ml-1">/ 100</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" domain={[0, 40]} stroke="#9ca3af" />
          <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-400">
              {item.name}: {item.value}/{item.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
