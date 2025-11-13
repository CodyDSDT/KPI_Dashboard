/**
 * INLC Strategic Plan Type Definitions
 *
 * This file defines the core data structures for the INLC Strategic Dashboard,
 * including Objectives, Strategies, Tactics, and KPIs with their roll-up relationships.
 */

export type MetricType = "numeric" | "milestone";

/**
 * Status thresholds for roll-up calculations:
 * - On Track: >= 0.70 (70%)
 * - At Risk: 0.40 - 0.69 (40-69%)
 * - Off Track: < 0.40 (below 40%)
 */
export type StatusLevel = "on-track" | "at-risk" | "off-track";

/**
 * KPI (Key Performance Indicator)
 * Represents a measurable metric tied to objectives, strategies, or tactics
 */
export type KPI = {
  id: string;              // e.g., "3.5.6.1" - hierarchical ID following INLC numbering
  name: string;
  metricType: MetricType;  // numeric => target/current; milestone => 0/1
  target: number;
  current: number;
  unit?: string;           // "acres", "%", "$", etc.
  ownerDept?: string[];    // ["Stewardship","ED"]
  start?: string;          // ISO8601 date string
  end?: string;            // ISO8601 date string
  objectiveId?: string;    // "3"
  strategyId?: string;     // "3.5"
  tacticId?: string;       // optional - if nested under a tactic
  notes?: string;          // additional context or inline notes
  lastUpdated?: string;    // ISO8601 timestamp of last edit
};

/**
 * Tactic
 * Optional sub-level under a Strategy
 */
export type Tactic = {
  id: string;              // e.g., "3.5.6"
  name: string;
  description?: string;
  kpis?: KPI[];            // KPIs directly associated with this tactic
};

/**
 * Strategy
 * Mid-level plan that rolls up to an Objective
 */
export type Strategy = {
  id: string;              // e.g., "3.5"
  name: string;
  description?: string;
  tactics?: Tactic[];      // Optional sub-tactics
  kpis?: KPI[];            // KPIs directly associated with this strategy
};

/**
 * Objective
 * Top-level strategic goal
 */
export type Objective = {
  id: string;              // e.g., "3"
  name: string;
  description?: string;
  strategies: Strategy[];  // Strategies that support this objective
  lastUpdated?: string;    // ISO8601 timestamp
};

/**
 * Computed status with percentage
 */
export type StatusWithPercent = {
  percent: number;         // 0.0 to 1.0
  status: StatusLevel;     // derived from percent
  total?: number;          // total count of KPIs rolled up
};

/**
 * Data store structure
 */
export type ObjectivesData = {
  objectives: Objective[];
  lastSync?: string;       // ISO8601 timestamp of last ETL run
  version?: string;        // data schema version
};

export type KPIsData = {
  kpis: KPI[];             // flat list for quick lookup
  lastSync?: string;
  version?: string;
};

/**
 * Diff structure for showing changes in admin UI
 */
export type KPIDiff = {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
};

/**
 * Backup metadata
 */
export type BackupMeta = {
  timestamp: string;
  filename: string;
  user?: string;
  description?: string;
};
