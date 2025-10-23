// Display helpers for assessment enums after backend stories 1-11 changes

import { CostRange, EffortRange } from '@/types/assessment';

/**
 * Maps CostRange enum values to user-friendly display strings
 */
export const formatCostRange = (cost: CostRange): string => {
  const costDisplayMap: Record<CostRange, string> = {
    UNDER_10K: 'Under €10K',
    RANGE_10K_50K: '€10K - €50K',
    RANGE_50K_100K: '€50K - €100K',
    RANGE_100K_250K: '€100K - €250K',
    OVER_250K: 'Over €250K',
  };

  return costDisplayMap[cost] || cost;
};

/**
 * Maps EffortRange enum values to user-friendly display strings
 */
export const formatEffortRange = (effort: EffortRange): string => {
  const effortDisplayMap: Record<EffortRange, string> = {
    SMALL: 'Small (Days-Weeks)',
    MEDIUM: 'Medium (Weeks-Months)',
    LARGE: 'Large (Months+)',
  };

  return effortDisplayMap[effort] || effort;
};

/**
 * Gets a color class for cost range severity
 */
export const getCostRangeColor = (cost: CostRange): string => {
  const colorMap: Record<CostRange, string> = {
    UNDER_10K: 'text-green-400',
    RANGE_10K_50K: 'text-yellow-400',
    RANGE_50K_100K: 'text-orange-400',
    RANGE_100K_250K: 'text-red-400',
    OVER_250K: 'text-red-500',
  };

  return colorMap[cost] || 'text-gray-400';
};

/**
 * Gets a color class for effort range
 */
export const getEffortRangeColor = (effort: EffortRange): string => {
  const colorMap: Record<EffortRange, string> = {
    SMALL: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    LARGE: 'text-orange-400',
  };

  return colorMap[effort] || 'text-gray-400';
};

/**
 * Converts old enum values to new format for backward compatibility
 * Use this when loading old data that might have the old enum values
 */
export const migrateCostRange = (oldValue: string): CostRange => {
  const migrationMap: Record<string, CostRange> = {
    LOW: 'UNDER_10K',
    MEDIUM: 'RANGE_10K_50K',
    HIGH: 'RANGE_50K_100K',
    VERY_HIGH: 'OVER_250K',
  };

  return migrationMap[oldValue] || (oldValue as CostRange);
};

/**
 * Converts old effort enum values to new format for backward compatibility
 */
export const migrateEffortRange = (oldValue: string): EffortRange => {
  const migrationMap: Record<string, EffortRange> = {
    DAYS: 'SMALL',
    WEEKS: 'SMALL',
    MONTHS: 'MEDIUM',
    QUARTERS: 'LARGE',
  };

  return migrationMap[oldValue] || (oldValue as EffortRange);
};
