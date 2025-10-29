// Epic 13 - Story 13.2: Priority Boost Breakdown Chart Component
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PriorityBoost } from '@/types/vendor-matching.types';
import { AlertCircle } from 'lucide-react';

interface PriorityBoostChartProps {
  priorityBoost: PriorityBoost;
}

export const PriorityBoostChart: React.FC<PriorityBoostChartProps> = ({ priorityBoost }) => {
  const data = [
    {
      name: 'Top Priority',
      value: priorityBoost.topPriorityBoost,
      max: 20,
      color: '#06b6d4', // cyan-500
    },
    {
      name: 'Features',
      value: priorityBoost.featureBoost,
      max: 10,
      color: '#ec4899', // pink-500
    },
    {
      name: 'Deployment',
      value: priorityBoost.deploymentBoost,
      max: 5,
      color: '#8b5cf6', // violet-500
    },
    {
      name: 'Speed',
      value: priorityBoost.speedBoost,
      max: 5,
      color: '#f59e0b', // amber-500
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
        <h4 className="text-sm font-semibold text-gray-400 mb-1">Priority Boost</h4>
        <p className="text-2xl font-bold text-white">
          +{priorityBoost.totalBoost}
          <span className="text-gray-500 text-lg ml-1">/ 40</span>
        </p>
      </div>

      {/* Matched Priority Display */}
      {priorityBoost.matchedPriority && priorityBoost.topPriorityBoost > 0 && (
        <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-cyan-400 text-sm font-medium">
            ✓ Covers your {priorityBoost.topPriorityBoost === 20 ? '#1' : priorityBoost.topPriorityBoost === 15 ? '#2' : '#3'} priority: {priorityBoost.matchedPriority}
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" domain={[0, 20]} stroke="#9ca3af" />
          <YAxis type="category" dataKey="name" stroke="#9ca3af" width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Missing Features Warning */}
      {priorityBoost.missingFeatures && priorityBoost.missingFeatures.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-medium mb-1">
                Missing {priorityBoost.missingFeatures.length} feature{priorityBoost.missingFeatures.length > 1 ? 's' : ''}
              </p>
              <ul className="text-gray-400 text-xs space-y-1">
                {priorityBoost.missingFeatures.map((feature, idx) => (
                  <li key={idx}>• {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
