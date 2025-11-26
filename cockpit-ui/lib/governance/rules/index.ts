/**
 * Governance Rules Index
 *
 * Exports all gate rules for G13-G21.
 */

export { G13Rule } from './G13';
export { G14Rule } from './G14';
export { G15Rule } from './G15';
export { G16Rule } from './G16';
export { G17Rule } from './G17';
export { G18Rule } from './G18';
export { G19Rule } from './G19';
export { G20Rule } from './G20';
export { G21Rule } from './G21';

import { G13Rule } from './G13';
import { G14Rule } from './G14';
import { G15Rule } from './G15';
import { G16Rule } from './G16';
import { G17Rule } from './G17';
import { G18Rule } from './G18';
import { G19Rule } from './G19';
import { G20Rule } from './G20';
import { G21Rule } from './G21';

import type { GateRule } from '../types';

/**
 * All governance rules in evaluation order
 */
export const ALL_RULES: GateRule[] = [
  G13Rule,
  G14Rule,
  G15Rule,
  G16Rule,
  G17Rule,
  G18Rule,
  G19Rule,
  G20Rule,
  G21Rule,
];

/**
 * Get rule by gate ID
 */
export function getRuleById(gateId: string): GateRule | undefined {
  return ALL_RULES.find((rule) => rule.id === gateId);
}

/**
 * Get total weight of all rules (should sum to 1.0)
 */
export function getTotalWeight(): number {
  return ALL_RULES.reduce((sum, rule) => sum + rule.weight, 0);
}
