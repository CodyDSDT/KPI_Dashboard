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

  rows.forEach((row, idx) => {
    try {
      const id = String(row.ID || row.Id || row.id || '').trim();
      const name = String(row.Name || row.Title || row.name || '').trim();
      const description = String(row.Description || row.description || '').trim() || undefined;
      const type = String(row.Type || row.type || '').trim().toLowerCase();

      if (!id || !name) {
        console.warn(`  ⚠ Row ${idx + 2}: Missing ID or Name, skipping`);
        return;
      }

      const parts = id.split('.');

      if (parts.length === 1 || type === 'objective') {
        // Objective
        entities.set(id, {
          id,
          name,
          description,
          strategies: [],
          lastUpdated: new Date().toISOString()
        });
      } else if (parts.length === 2 || type === 'strategy') {
        // Strategy
        entities.set(id, {
          id,
          name,
          description,
          tactics: [],
          kpis: []
        });
      } else if (parts.length === 3 || type === 'tactic') {
        // Tactic
        entities.set(id, {
          id,
          name,
          description,
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

  rows.forEach((row, idx) => {
    try {
      const id = String(row.ID || row.Id || row.id || '').trim();
      const name = String(row.Name || row.KPI || row.Metric || row.name || '').trim();

      if (!id || !name) {
        return; // Skip rows without ID or name
      }

      const metricTypeRaw = String(row['Metric Type'] || row.MetricType || row.Type || 'numeric').trim().toLowerCase();
      const metricType: MetricType = metricTypeRaw === 'milestone' ? 'milestone' : 'numeric';

      const target = parseFloat(row.Target || row.target || '0') || 0;
      const current = parseFloat(row.Current || row.current || row.Actual || '0') || 0;
      const unit = String(row.Unit || row.unit || '').trim() || undefined;

      const ownerDeptRaw = String(row.Owner || row['Owner Dept'] || row.Department || '').trim();
      const ownerDept = ownerDeptRaw ? ownerDeptRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined;

      const start = row.Start || row['Start Date'] || undefined;
      const end = row.End || row['End Date'] || row.Deadline || undefined;

      const notes = String(row.Notes || row.notes || '').trim() || undefined;

      const hierarchy = parseIdHierarchy(id);

      const kpi: KPI = {
        id,
        name,
        metricType,
        target,
        current,
        unit,
        ownerDept,
        start: start ? new Date(start).toISOString() : undefined,
        end: end ? new Date(end).toISOString() : undefined,
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
