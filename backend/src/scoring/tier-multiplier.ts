/**
 * Evidence Tier Multiplier Utility
 * Provides multipliers for evidence quality tiers
 */

export enum EvidenceTier {
  TIER_0 = 'TIER_0', // Self-Declared
  TIER_1 = 'TIER_1', // Policy Documents
  TIER_2 = 'TIER_2', // System-Generated
}

/**
 * Get the multiplier for a given evidence tier
 * @param tier - The evidence tier
 * @returns The multiplier value (0.6 for TIER_0, 0.8 for TIER_1, 1.0 for TIER_2)
 */
export function getMultiplier(tier: EvidenceTier | string): number {
  switch (tier) {
    case EvidenceTier.TIER_2:
      return 1.0; // No penalty for system-generated evidence
    case EvidenceTier.TIER_1:
      return 0.8; // 20% reduction for policy documents
    case EvidenceTier.TIER_0:
      return 0.6; // 40% reduction for self-declared evidence
    default:
      // Default to lowest tier if unknown
      return 0.6;
  }
}

/**
 * Get the best evidence tier from a list of tiers
 * Higher tier numbers are better (TIER_2 > TIER_1 > TIER_0)
 * @param tiers - Array of evidence tiers
 * @returns The best tier, or TIER_0 if empty
 */
export function getBestTier(tiers: (EvidenceTier | string)[]): EvidenceTier {
  if (!tiers || tiers.length === 0) {
    return EvidenceTier.TIER_0;
  }

  // Check for TIER_2 first (best)
  if (tiers.some(t => t === EvidenceTier.TIER_2 || t === 'TIER_2')) {
    return EvidenceTier.TIER_2;
  }

  // Check for TIER_1 next
  if (tiers.some(t => t === EvidenceTier.TIER_1 || t === 'TIER_1')) {
    return EvidenceTier.TIER_1;
  }

  // Default to TIER_0
  return EvidenceTier.TIER_0;
}
