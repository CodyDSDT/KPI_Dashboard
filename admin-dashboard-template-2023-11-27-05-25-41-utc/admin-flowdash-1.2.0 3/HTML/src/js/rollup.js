/**
 * INLC Strategic Plan Roll-up Utilities (JavaScript)
 *
 * Client-side version of rollup calculations for use in the browser
 */

// Status thresholds
const THRESHOLD_ON_TRACK = 0.70;
const THRESHOLD_AT_RISK = 0.40;

/**
 * Calculate completion percentage for a single KPI
 * @param {Object} kpi - KPI object
 * @returns {number} Completion percentage (0.0 to 1.0)
 */
export function kpiPct(kpi) {
  if (kpi.metricType === 'numeric') {
    if (kpi.target === 0) return 0;
    return Math.max(0, Math.min(1, kpi.current / kpi.target));
  }
  return kpi.current ? 1 : 0;
}

/**
 * Aggregate an array of percentages by averaging
 * @param {number[]} vals - Array of completion percentages
 * @returns {number} Average percentage
 */
export function aggPct(vals) {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Calculate completion percentage for a Tactic
 * @param {Object} tactic - Tactic object
 * @returns {number} Completion percentage
 */
export function tacticPct(tactic) {
  if (!tactic.kpis || tactic.kpis.length === 0) return 0;
  return aggPct(tactic.kpis.map(kpiPct));
}

/**
 * Calculate completion percentage for a Strategy
 * @param {Object} strategy - Strategy object
 * @returns {number} Completion percentage
 */
export function strategyPct(strategy) {
  const directKPIs = (strategy.kpis || []).map(kpiPct);
  const tacticKPIs = (strategy.tactics || []).flatMap(t => (t.kpis || []).map(kpiPct));
  const allVals = [...directKPIs, ...tacticKPIs];
  return aggPct(allVals);
}

/**
 * Calculate completion percentage for an Objective
 * @param {Object} objective - Objective object
 * @returns {number} Completion percentage
 */
export function objectivePct(objective) {
  if (!objective.strategies || objective.strategies.length === 0) return 0;
  return aggPct(objective.strategies.map(strategyPct));
}

/**
 * Determine status level from percentage
 * @param {number} pct - Completion percentage
 * @returns {string} Status level: 'on-track', 'at-risk', or 'off-track'
 */
export function getStatusLevel(pct) {
  if (pct >= THRESHOLD_ON_TRACK) return 'on-track';
  if (pct >= THRESHOLD_AT_RISK) return 'at-risk';
  return 'off-track';
}

/**
 * Calculate status with percentage for any entity
 * @param {number} percent - Completion percentage
 * @param {number} total - Total count of KPIs
 * @returns {Object} Status object with percent, status, and total
 */
export function calculateStatus(percent, total) {
  return {
    percent,
    status: getStatusLevel(percent),
    total
  };
}

/**
 * Format percentage for display
 * @param {number} pct - Percentage (0.0 to 1.0)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercent(pct, decimals = 0) {
  return `${(pct * 100).toFixed(decimals)}%`;
}

/**
 * Get CSS class for status badge
 * @param {string} status - Status level
 * @returns {string} CSS class name
 */
export function getStatusClass(status) {
  switch (status) {
    case 'on-track':
      return 'badge-success bg-success';
    case 'at-risk':
      return 'badge-warning bg-warning';
    case 'off-track':
      return 'badge-danger bg-danger';
    default:
      return 'badge-secondary bg-secondary';
  }
}

/**
 * Get display label for status
 * @param {string} status - Status level
 * @returns {string} Display label
 */
export function getStatusLabel(status) {
  switch (status) {
    case 'on-track':
      return 'On Track';
    case 'at-risk':
      return 'At Risk';
    case 'off-track':
      return 'Off Track';
    default:
      return 'Unknown';
  }
}

/**
 * Count total KPIs under a Strategy
 * @param {Object} strategy - Strategy object
 * @returns {number} Total KPI count
 */
export function strategyKPICount(strategy) {
  const directKPIs = (strategy.kpis || []).length;
  const tacticKPIs = (strategy.tactics || []).reduce(
    (sum, t) => sum + (t.kpis || []).length,
    0
  );
  return directKPIs + tacticKPIs;
}

/**
 * Count total KPIs under an Objective
 * @param {Object} objective - Objective object
 * @returns {number} Total KPI count
 */
export function objectiveKPICount(objective) {
  return objective.strategies.reduce((sum, s) => {
    return sum + strategyKPICount(s);
  }, 0);
}
