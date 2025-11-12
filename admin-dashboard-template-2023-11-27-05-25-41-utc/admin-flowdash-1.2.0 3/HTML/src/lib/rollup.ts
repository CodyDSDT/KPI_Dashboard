/**
 * INLC Strategic Plan Roll-up Utilities
 *
 * Functions for calculating KPI completion percentages and status levels,
 * and rolling up these metrics through the Objective → Strategy → Tactic hierarchy.
 */

import {
  KPI,
  Tactic,
  Strategy,
  Objective,
  StatusLevel,
  StatusWithPercent,
  MetricType
} from '../types/strategy';

/**
 * Status thresholds
 */
const THRESHOLD_ON_TRACK = 0.70;
const THRESHOLD_AT_RISK = 0.40;

/**
 * Calculate completion percentage for a single KPI
 * - Numeric KPIs: current / target (capped at 1.0)
 * - Milestone KPIs: 0 (not done) or 1 (done)
 *
 * @param k - KPI object
 * @returns Completion percentage (0.0 to 1.0)
 */
export const kpiPct = (k: KPI): number => {
  if (k.metricType === "numeric") {
    // Avoid division by zero
    if (k.target === 0) return 0;
    // Cap at 100% (1.0) even if current exceeds target
    return Math.max(0, Math.min(1, k.current / k.target));
  }
  // Milestone: 1 if completed (current > 0), 0 otherwise
  return k.current ? 1 : 0;
};

/**
 * Aggregate an array of percentages by averaging
 *
 * @param vals - Array of completion percentages (0.0 to 1.0)
 * @returns Average percentage, or 0 if empty array
 */
export const aggPct = (vals: number[]): number => {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

/**
 * Calculate completion percentage for a Tactic
 * Averages all KPIs associated with the tactic
 *
 * @param t - Tactic object
 * @returns Completion percentage (0.0 to 1.0)
 */
export const tacticPct = (t: Tactic): number => {
  if (!t.kpis || t.kpis.length === 0) return 0;
  return aggPct(t.kpis.map(kpiPct));
};

/**
 * Calculate completion percentage for a Strategy
 * Averages:
 * - Direct KPIs attached to the strategy
 * - Roll-ups from all tactics under the strategy
 *
 * @param s - Strategy object
 * @returns Completion percentage (0.0 to 1.0)
 */
export const strategyPct = (s: Strategy): number => {
  const directKPIs = (s.kpis ?? []).map(kpiPct);
  const tacticKPIs = (s.tactics ?? []).flatMap(t => (t.kpis ?? []).map(kpiPct));
  const allVals = [...directKPIs, ...tacticKPIs];
  return aggPct(allVals);
};

/**
 * Calculate completion percentage for an Objective
 * Averages roll-ups from all strategies
 *
 * @param o - Objective object
 * @returns Completion percentage (0.0 to 1.0)
 */
export const objectivePct = (o: Objective): number => {
  if (!o.strategies || o.strategies.length === 0) return 0;
  return aggPct(o.strategies.map(strategyPct));
};

/**
 * Determine status level from percentage
 *
 * @param pct - Completion percentage (0.0 to 1.0)
 * @returns StatusLevel: on-track, at-risk, or off-track
 */
export const getStatusLevel = (pct: number): StatusLevel => {
  if (pct >= THRESHOLD_ON_TRACK) return "on-track";
  if (pct >= THRESHOLD_AT_RISK) return "at-risk";
  return "off-track";
};

/**
 * Calculate status with percentage for a KPI
 *
 * @param k - KPI object
 * @returns StatusWithPercent object
 */
export const kpiStatus = (k: KPI): StatusWithPercent => {
  const percent = kpiPct(k);
  return {
    percent,
    status: getStatusLevel(percent),
    total: 1
  };
};

/**
 * Calculate status with percentage for a Tactic
 *
 * @param t - Tactic object
 * @returns StatusWithPercent object
 */
export const tacticStatus = (t: Tactic): StatusWithPercent => {
  const percent = tacticPct(t);
  return {
    percent,
    status: getStatusLevel(percent),
    total: (t.kpis ?? []).length
  };
};

/**
 * Calculate status with percentage for a Strategy
 *
 * @param s - Strategy object
 * @returns StatusWithPercent object
 */
export const strategyStatus = (s: Strategy): StatusWithPercent => {
  const percent = strategyPct(s);
  const directKPICount = (s.kpis ?? []).length;
  const tacticKPICount = (s.tactics ?? []).reduce(
    (sum, t) => sum + (t.kpis ?? []).length,
    0
  );
  return {
    percent,
    status: getStatusLevel(percent),
    total: directKPICount + tacticKPICount
  };
};

/**
 * Calculate status with percentage for an Objective
 *
 * @param o - Objective object
 * @returns StatusWithPercent object
 */
export const objectiveStatus = (o: Objective): StatusWithPercent => {
  const percent = objectivePct(o);
  const totalKPIs = o.strategies.reduce((sum, s) => {
    const directKPIs = (s.kpis ?? []).length;
    const tacticKPIs = (s.tactics ?? []).reduce(
      (tSum, t) => tSum + (t.kpis ?? []).length,
      0
    );
    return sum + directKPIs + tacticKPIs;
  }, 0);
  return {
    percent,
    status: getStatusLevel(percent),
    total: totalKPIs
  };
};

/**
 * Count total KPIs under a Strategy (including tactics)
 *
 * @param s - Strategy object
 * @returns Total KPI count
 */
export const strategyKPICount = (s: Strategy): number => {
  const directKPIs = (s.kpis ?? []).length;
  const tacticKPIs = (s.tactics ?? []).reduce(
    (sum, t) => sum + (t.kpis ?? []).length,
    0
  );
  return directKPIs + tacticKPIs;
};

/**
 * Count total Strategies under an Objective
 *
 * @param o - Objective object
 * @returns Total Strategy count
 */
export const objectiveStrategyCount = (o: Objective): number => {
  return o.strategies.length;
};

/**
 * Format percentage for display
 *
 * @param pct - Percentage (0.0 to 1.0)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string like "75%" or "75.5%"
 */
export const formatPercent = (pct: number, decimals: number = 0): string => {
  return `${(pct * 100).toFixed(decimals)}%`;
};

/**
 * Get CSS class for status badge
 *
 * @param status - StatusLevel
 * @returns CSS class name
 */
export const getStatusClass = (status: StatusLevel): string => {
  switch (status) {
    case "on-track":
      return "badge-success";
    case "at-risk":
      return "badge-warning";
    case "off-track":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};

/**
 * Get display label for status
 *
 * @param status - StatusLevel
 * @returns Display label
 */
export const getStatusLabel = (status: StatusLevel): string => {
  switch (status) {
    case "on-track":
      return "On Track";
    case "at-risk":
      return "At Risk";
    case "off-track":
      return "Off Track";
    default:
      return "Unknown";
  }
};
