/**
 * Weight Validation Utility
 * Validates that weights sum to 1.0 (100%)
 */

const WEIGHT_TOLERANCE = 0.01; // Allow ±1% tolerance

/**
 * Validate that weights sum to 1.0
 * @param weights - Array of weight values
 * @param tolerance - Allowed tolerance (default 0.01)
 * @returns True if valid, false otherwise
 */
export function validateWeights(weights: number[], tolerance: number = WEIGHT_TOLERANCE): boolean {
  if (!weights || weights.length === 0) {
    return false;
  }

  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  return Math.abs(sum - 1.0) <= tolerance;
}

/**
 * Calculate the sum of weights
 * @param weights - Array of weight values
 * @returns Sum of all weights
 */
export function sumWeights(weights: number[]): number {
  if (!weights || weights.length === 0) {
    return 0;
  }
  return weights.reduce((acc, weight) => acc + weight, 0);
}

/**
 * Normalize weights to sum to 1.0
 * Useful for correcting minor rounding errors
 * @param weights - Array of weight values
 * @returns Normalized weights that sum to 1.0
 */
export function normalizeWeights(weights: number[]): number[] {
  if (!weights || weights.length === 0) {
    return [];
  }

  const sum = sumWeights(weights);
  if (sum === 0) {
    // If all weights are 0, distribute equally
    return weights.map(() => 1.0 / weights.length);
  }

  return weights.map(weight => weight / sum);
}

/**
 * Validate weights and throw error if invalid
 * @param weights - Array of weight values
 * @param context - Description of what the weights represent (for error message)
 * @throws Error if weights don't sum to 1.0 within tolerance
 */
export function requireValidWeights(weights: number[], context: string = 'weights'): void {
  const sum = sumWeights(weights);
  if (Math.abs(sum - 1.0) > WEIGHT_TOLERANCE) {
    throw new Error(`${context} sum to ${sum.toFixed(4)}, must equal 1.0 (±${WEIGHT_TOLERANCE})`);
  }
}
