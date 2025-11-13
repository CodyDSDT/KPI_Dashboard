/**
 * ETL Script for INLC Strategic Plan Data
 *
 * Reads Excel files from data-source/ and generates normalized JSON files:
 * - data/objectives.json (hierarchical structure)
 * - data/kpis.json (flat list for quick lookup)
 *
 * Also creates timestamped backups in data/backups/
 *
 * Usage: ts-node scripts/etl.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

type MetricType = "numeric" | "milestone";

interface KPI {
  id: string;
  name: string;
  metricType: MetricType;
  target: number;
  current: number;
  unit?: string;
  ownerDept?: string[];
  start?: string;
  end?: string;
  objectiveId?: string;
  strategyId?: string;
  tacticId?: string;
  notes?: string;
  lastUpdated?: string;
}

interface Tactic {
  id: string;
  name: string;
  description?: string;
  kpis?: KPI[];
}

interface Strategy {
  id: string;
  name: string;
  description?: string;
  tactics?: Tactic[];
  kpis?: KPI[];
}

interface Objective {
  id: string;
  name: string;
  description?: string;
  strategies: Strategy[];
  lastUpdated?: string;
}

// Paths
const DATA_SOURCE_DIR = path.join(__dirname, '../data-source');
const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const COMBINED_OBJECTIVES_PATH = path.join(DATA_SOURCE_DIR, 'Combined Objectives.xlsx');
const TRACKING_PATH = path.join(DATA_SOURCE_DIR, 'INLC_Strategic_Plan_Tracking.xlsx');

const OBJECTIVES_OUTPUT = path.join(DATA_DIR, 'objectives.json');
const KPIS_OUTPUT = path.join(DATA_DIR, 'kpis.json');

/**
 * Ensure required directories exist
 */
function ensureDirectories() {
  [DATA_DIR, BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
}

/**
 * Create timestamped backup of existing data files
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData: any = {};

  if (fs.existsSync(OBJECTIVES_OUTPUT)) {
    const content = fs.readFileSync(OBJECTIVES_OUTPUT, 'utf-8');
    backupData.objectives = JSON.parse(content);
  }

  if (fs.existsSync(KPIS_OUTPUT)) {
    const content = fs.readFileSync(KPIS_OUTPUT, 'utf-8');
    backupData.kpis = JSON.parse(content);
  }

  if (Object.keys(backupData).length > 0) {
    const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✓ Created backup: ${backupPath}`);
  }
}

/**
 * Helper function to get value from row with multiple possible column names
 */
function getColumnValue(row: any, ...possibleNames: string[]): any {
  for (const name of possibleNames) {
    // Check exact match
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
    // Check case-insensitive match
    const lowerName = name.toLowerCase();
    const key = Object.keys(row).find(k => k.toLowerCase() === lowerName);
    if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

/**
 * Parse ID hierarchy to extract components
 * Example: "3.5.6.1" -> { objectiveId: "3", strategyId: "3.5", tacticId: "3.5.6" }
 */
function parseIdHierarchy(id: string): { objectiveId: string; strategyId?: string; tacticId?: string } {
  const parts = id.split('.');
  return {
    objectiveId: parts[0],
    strategyId: parts.length >= 2 ? parts.slice(0, 2).join('.') : undefined,
    tacticId: parts.length >= 3 ? parts.slice(0, 3).join('.') : undefined
  };
}

/**
 * Parse Combined Objectives.xlsx to build hierarchy structure
 */
function parseCombinedObjectives(): Map<string, Objective | Strategy | Tactic> {
  const entities = new Map<string, Objective | Strategy | Tactic>();

  if (!fs.existsSync(COMBINED_OBJECTIVES_PATH)) {
    console.warn(`⚠ Combined Objectives file not found: ${COMBINED_OBJECTIVES_PATH}`);
    console.warn('  Creating empty structure. Please upload the file and re-run ETL.');
    return entities;
  }

  const workbook = xlsx.readFile(COMBINED_OBJECTIVES_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = xlsx.utils.sheet_to_json(worksheet);

  console.log(`✓ Reading ${rows.length} rows from Combined Objectives`);
  console.log(`  Sheet: "${sheetName}"`);

  // Show available columns for first row
  if (rows.length > 0) {
    console.log(`  Available columns: ${Object.keys(rows[0]).join(', ')}`);
  }

  rows.forEach((row, idx) => {
    try {
      // Try multiple possible column names
      const id = getColumnValue(row, 'ID', 'Id', 'id', 'Number', 'Num', '#');
      const name = getColumnValue(row, 'Name', 'Title', 'name', 'title', 'Objective', 'Strategy', 'Tactic', 'Goal');
      const description = getColumnValue(row, 'Description', 'description', 'desc', 'Details', 'details', 'Notes', 'notes');
      const type = getColumnValue(row, 'Type', 'type', 'Level', 'level', 'Category', 'category');

      const idStr = id ? String(id).trim() : '';
      const nameStr = name ? String(name).trim() : '';
      const descStr = description ? String(description).trim() : undefined;
      const typeStr = type ? String(type).trim().toLowerCase() : '';

      if (!idStr || !nameStr) {
        // Only warn for first 5 empty rows
        if (idx < 5) {
          console.warn(`  ⚠ Row ${idx + 2}: Missing ID or Name, skipping`);
        }
        return;
      }

      const parts = idStr.split('.');

      if (parts.length === 1 || typeStr === 'objective' || typeStr === 'goal') {
        // Objective
        entities.set(idStr, {
          id: idStr,
          name: nameStr,
          description: descStr,
          strategies: [],
          lastUpdated: new Date().toISOString()
        });
      } else if (parts.length === 2 || typeStr === 'strategy') {
        // Strategy
        entities.set(idStr, {
          id: idStr,
          name: nameStr,
          description: descStr,
          tactics: [],
          kpis: []
        });
      } else if (parts.length >= 3 || typeStr === 'tactic' || typeStr === 'action') {
        // Tactic
        entities.set(idStr, {
          id: idStr,
          name: nameStr,
          description: descStr,
          kpis: []
        });
      }
    } catch (err) {
      console.error(`  ✗ Error parsing row ${idx + 2}:`, err);
    }
  });

  console.log(`✓ Parsed ${entities.size} entities from Combined Objectives`);
  return entities;
}

/**
 * Parse INLC_Strategic_Plan_Tracking.xlsx to extract KPI data
 */
function parseTrackingData(): KPI[] {
  const kpis: KPI[] = [];

  if (!fs.existsSync(TRACKING_PATH)) {
    console.warn(`⚠ Tracking file not found: ${TRACKING_PATH}`);
    console.warn('  No KPI data will be imported. Please upload the file and re-run ETL.');
    return kpis;
  }

  const workbook = xlsx.readFile(TRACKING_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = xlsx.utils.sheet_to_json(worksheet);

  console.log(`✓ Reading ${rows.length} rows from Tracking data`);
  console.log(`  Sheet: "${sheetName}"`);

  // Show available columns for first row
  if (rows.length > 0) {
    console.log(`  Available columns: ${Object.keys(rows[0]).join(', ')}`);
  }

  rows.forEach((row, idx) => {
    try {
      // Try multiple possible column names
      const id = getColumnValue(row, 'ID', 'Id', 'id', 'Number', 'Num', '#', 'KPI ID', 'Metric ID');
      const name = getColumnValue(row, 'Name', 'KPI', 'Metric', 'name', 'kpi', 'metric', 'Title', 'Indicator', 'Measure');

      const idStr = id ? String(id).trim() : '';
      const nameStr = name ? String(name).trim() : '';

      if (!idStr || !nameStr) {
        // Only warn for first 5 empty rows
        if (idx < 5) {
          console.warn(`  ⚠ Row ${idx + 2}: Missing ID or Name, skipping`);
        }
        return;
      }

      const metricTypeRaw = getColumnValue(row, 'Metric Type', 'MetricType', 'Type', 'type', 'Kind');
      const metricTypeStr = metricTypeRaw ? String(metricTypeRaw).trim().toLowerCase() : 'numeric';
      const metricType: MetricType = metricTypeStr.includes('milestone') ? 'milestone' : 'numeric';

      const targetVal = getColumnValue(row, 'Target', 'target', 'Goal', 'goal', 'Target Value');
      const currentVal = getColumnValue(row, 'Current', 'current', 'Actual', 'actual', 'Current Value', 'Progress');
      const target = parseFloat(targetVal || '0') || 0;
      const current = parseFloat(currentVal || '0') || 0;

      const unitVal = getColumnValue(row, 'Unit', 'unit', 'Units', 'Measure', 'UOM');
      const unit = unitVal ? String(unitVal).trim() : undefined;

      const ownerVal = getColumnValue(row, 'Owner', 'owner', 'Owner Dept', 'OwnerDept', 'Department', 'Responsible', 'Lead');
      const ownerDeptRaw = ownerVal ? String(ownerVal).trim() : '';
      const ownerDept = ownerDeptRaw ? ownerDeptRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined;

      const startVal = getColumnValue(row, 'Start', 'start', 'Start Date', 'StartDate', 'Begin');
      const endVal = getColumnValue(row, 'End', 'end', 'End Date', 'EndDate', 'Deadline', 'Due Date', 'Target Date');

      const notesVal = getColumnValue(row, 'Notes', 'notes', 'Comments', 'comments', 'Description', 'Details');
      const notes = notesVal ? String(notesVal).trim() : undefined;

      const hierarchy = parseIdHierarchy(idStr);

      const kpi: KPI = {
        id: idStr,
        name: nameStr,
        metricType,
        target,
        current,
        unit,
        ownerDept,
        start: startVal ? new Date(startVal).toISOString() : undefined,
        end: endVal ? new Date(endVal).toISOString() : undefined,
        objectiveId: hierarchy.objectiveId,
        strategyId: hierarchy.strategyId,
        tacticId: hierarchy.tacticId,
        notes,
        lastUpdated: new Date().toISOString()
      };

      kpis.push(kpi);
    } catch (err) {
      console.error(`  ✗ Error parsing KPI row ${idx + 2}:`, err);
    }
  });

  console.log(`✓ Parsed ${kpis.length} KPIs from Tracking data`);
  return kpis;
}

/**
 * Build hierarchical structure by linking KPIs to Objectives/Strategies/Tactics
 */
function buildHierarchy(
  entities: Map<string, Objective | Strategy | Tactic>,
  kpis: KPI[]
): Objective[] {
  // Organize entities by type
  const objectives = new Map<string, Objective>();
  const strategies = new Map<string, Strategy>();
  const tactics = new Map<string, Tactic>();

  entities.forEach((entity, id) => {
    if ('strategies' in entity) {
      objectives.set(id, entity as Objective);
    } else if ('tactics' in entity) {
      strategies.set(id, entity as Strategy);
    } else if ('kpis' in entity) {
      tactics.set(id, entity as Tactic);
    }
  });

  // Attach KPIs to appropriate entities
  kpis.forEach(kpi => {
    if (kpi.tacticId && tactics.has(kpi.tacticId)) {
      const tactic = tactics.get(kpi.tacticId)!;
      if (!tactic.kpis) tactic.kpis = [];
      tactic.kpis.push(kpi);
    } else if (kpi.strategyId && strategies.has(kpi.strategyId)) {
      const strategy = strategies.get(kpi.strategyId)!;
      if (!strategy.kpis) strategy.kpis = [];
      strategy.kpis.push(kpi);
    } else {
      console.warn(`  ⚠ KPI ${kpi.id} could not be linked to any entity`);
    }
  });

  // Attach tactics to strategies
  tactics.forEach(tactic => {
    const strategyId = tactic.id.split('.').slice(0, 2).join('.');
    if (strategies.has(strategyId)) {
      const strategy = strategies.get(strategyId)!;
      if (!strategy.tactics) strategy.tactics = [];
      strategy.tactics.push(tactic);
    }
  });

  // Attach strategies to objectives
  strategies.forEach(strategy => {
    const objectiveId = strategy.id.split('.')[0];
    if (objectives.has(objectiveId)) {
      const objective = objectives.get(objectiveId)!;
      objective.strategies.push(strategy);
    }
  });

  return Array.from(objectives.values());
}

/**
 * Main ETL process
 */
function main() {
  console.log('========================================');
  console.log('INLC Strategic Plan ETL');
  console.log('========================================\n');

  // Ensure directories exist
  ensureDirectories();

  // Create backup of existing data
  createBackup();

  // Parse source files
  const entities = parseCombinedObjectives();
  const kpis = parseTrackingData();

  // Build hierarchy
  const objectives = buildHierarchy(entities, kpis);

  // Prepare output data
  const objectivesData = {
    objectives,
    lastSync: new Date().toISOString(),
    version: '1.0'
  };

  const kpisData = {
    kpis,
    lastSync: new Date().toISOString(),
    version: '1.0'
  };

  // Write output files
  fs.writeFileSync(OBJECTIVES_OUTPUT, JSON.stringify(objectivesData, null, 2));
  console.log(`\n✓ Wrote objectives to: ${OBJECTIVES_OUTPUT}`);

  fs.writeFileSync(KPIS_OUTPUT, JSON.stringify(kpisData, null, 2));
  console.log(`✓ Wrote KPIs to: ${KPIS_OUTPUT}`);

  // Summary
  console.log('\n========================================');
  console.log('ETL Summary:');
  console.log(`  Objectives: ${objectives.length}`);
  console.log(`  Strategies: ${objectives.reduce((sum, o) => sum + o.strategies.length, 0)}`);
  console.log(`  KPIs: ${kpis.length}`);
  console.log('========================================\n');
}

// Run ETL
main();
