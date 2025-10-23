/**
 * Score Aggregation Utility
 * Provides functions for weighted sum calculations
 */

/**
 * Calculate weighted sum of values
 * @param values - Array of numeric values to be weighted
 * @param weights - Array of weights (must correspond to values)
 * @returns Weighted sum, or 0 if inputs are invalid
 */
export function weightedSum(values: number[], weights: number[]): number {
  if (!values || !weights || values.length === 0 || weights.length === 0) {
    return 0;
  }

  if (values.length !== weights.length) {
    throw new Error(`Values length (${values.length}) must match weights length (${weights.length})`);
  }

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
  }

  return sum;
}

/**
 * Calculate weighted average
 * @param values - Array of numeric values to be weighted
 * @param weights - Array of weights (must sum to 1.0)
 * @returns Weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (!values || !weights || values.length === 0 || weights.length === 0) {
    return 0;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Protection against division by zero
  if (totalWeight === 0) {
    return 0;
  }

  const sum = weightedSum(values, weights);
  return sum / totalWeight;
}

/**
 * Scale a score from one range to another
 * @param score - The score to scale
 * @param fromMin - Minimum of current range
 * @param fromMax - Maximum of current range
 * @param toMin - Minimum of target range
 * @param toMax - Maximum of target range
 * @returns Scaled score
 */
export function scaleScore(
  score: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  // Clamp input to source range
  const clampedScore = Math.max(fromMin, Math.min(fromMax, score));

  // Scale to target range
  const fromRange = fromMax - fromMin;
  const toRange = toMax - toMin;

  if (fromRange === 0) {
    return toMin;
  }

  return toMin + ((clampedScore - fromMin) / fromRange) * toRange;
}

/**
 * Calculate aggregate statistics for a set of scores
 * @param scores - Array of numeric scores
 * @returns Object with min, max, mean, median
 */
export function calculateScoreStats(scores: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  count: number;
} {
  if (!scores || scores.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, count: 0 };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const count = scores.length;
  const sum = scores.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  let median: number;
  if (count % 2 === 0) {
    median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  } else {
    median = sorted[Math.floor(count / 2)];
  }

  return {
    min: sorted[0],
    max: sorted[count - 1],
    mean,
    median,
    count,
  };
}
