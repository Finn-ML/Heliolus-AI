import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { EvidenceTierDistributionProps } from '@/types/evidence-tier.types';

const COLORS = {
  TIER_0: '#6B7280', // gray-500
  TIER_1: '#3B82F6', // blue-500
  TIER_2: '#22C55E', // green-500
};

const LABELS = {
  TIER_0: 'Self-Declared',
  TIER_1: 'Policy Documents',
  TIER_2: 'System-Generated',
};

export function EvidenceTierDistribution({
  distribution,
  className = '',
}: EvidenceTierDistributionProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const size = isMobile ? 200 : 300;

  const total = distribution.tier0 + distribution.tier1 + distribution.tier2;

  const data = [
    { name: 'TIER_0', value: distribution.tier0, label: LABELS.TIER_0 },
    { name: 'TIER_1', value: distribution.tier1, label: LABELS.TIER_1 },
    { name: 'TIER_2', value: distribution.tier2, label: LABELS.TIER_2 },
  ].filter(item => item.value > 0); // Only show non-zero tiers

  // Empty state
  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 ${className}`}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm">No documents uploaded yet</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.value} document{data.value !== 1 ? 's' : ''} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className={`${isMobile ? 'flex flex-wrap justify-center gap-3' : 'space-y-2'}`}>
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.payload.value / total) * 100).toFixed(0);
          return (
            <li
              key={index}
              className={`flex items-center gap-2 text-sm ${isMobile ? '' : 'w-full'}`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.payload.label}: {entry.payload.value} ({percentage}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.25}
            outerRadius={size * 0.4}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={<CustomLegend />}
            verticalAlign={isMobile ? 'bottom' : 'middle'}
            align={isMobile ? 'center' : 'right'}
            layout={isMobile ? 'horizontal' : 'vertical'}
            wrapperStyle={isMobile ? { paddingTop: '20px' } : { paddingLeft: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EvidenceTierDistribution;
