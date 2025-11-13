/**
 * ETL Script for INLC Strategic Plan Data
 *
 * Reads from Updated_SharePoint_Import_Template.xlsx with separate sheets:
 * - Objectives
 * - Strategies
 * - Tactics
 * - KPIs
 *
 * Generates normalized JSON files:
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

const SHAREPOINT_TEMPLATE_PATH = path.join(DATA_SOURCE_DIR, 'Updated_SharePoint_Import_Template.xlsx');

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
 * Parse Objectives sheet
 */
function parseObjectives(workbook: xlsx.WorkBook): Map<string, Objective> {
  const objectives = new Map<string, Objective>();

  const sheet = workbook.Sheets['Objectives'];
  if (!sheet) {
    console.warn('⚠ Objectives sheet not found');
    return objectives;
  }

  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`✓ Reading ${rows.length} rows from Objectives sheet`);
  console.log(`  Columns: ${rows.length > 0 ? Object.keys(rows[0]).join(', ') : 'none'}`);

  rows.forEach((row, idx) => {
    try {
      const id = String(row.ObjectiveID || '').trim();
      const name = String(row.Title || '').trim();
      const description = String(row.Description || '').trim() || undefined;

      if (!id || !name) {
        if (idx < 3) console.warn(`  ⚠ Row ${idx + 2}: Missing ObjectiveID or Title`);
        return;
      }

      objectives.set(id, {
        id,
        name,
        description,
        strategies: [],
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error(`  ✗ Error parsing Objective row ${idx + 2}:`, err);
    }
  });

  console.log(`✓ Parsed ${objectives.size} objectives`);
  return objectives;
}

/**
 * Parse Strategies sheet
 */
function parseStrategies(workbook: xlsx.WorkBook): Map<string, Strategy> {
  const strategies = new Map<string, Strategy>();

  const sheet = workbook.Sheets['Strategies'];
  if (!sheet) {
    console.warn('⚠ Strategies sheet not found');
    return strategies;
  }

  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`✓ Reading ${rows.length} rows from Strategies sheet`);

  rows.forEach((row, idx) => {
    try {
      const id = String(row.StrategyID || '').trim();
      const parentId = String(row.ParentObjectiveID || '').trim();
      const name = String(row.Title || '').trim();
      const description = String(row.Description || '').trim() || undefined;

      if (!id || !name) {
        if (idx < 3) console.warn(`  ⚠ Row ${idx + 2}: Missing StrategyID or Title`);
        return;
      }

      strategies.set(id, {
        id,
        name,
        description,
        tactics: [],
        kpis: []
      });
    } catch (err) {
      console.error(`  ✗ Error parsing Strategy row ${idx + 2}:`, err);
    }
  });

  console.log(`✓ Parsed ${strategies.size} strategies`);
  return strategies;
}

/**
 * Parse Tactics sheet
 */
function parseTactics(workbook: xlsx.WorkBook): Map<string, Tactic> {
  const tactics = new Map<string, Tactic>();

  const sheet = workbook.Sheets['Tactics'];
  if (!sheet) {
    console.warn('⚠ Tactics sheet not found');
    return tactics;
  }

  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`✓ Reading ${rows.length} rows from Tactics sheet`);

  rows.forEach((row, idx) => {
    try {
      const id = String(row.TacticID || '').trim();
      const parentId = String(row.ParentStrategyID || '').trim();
      const name = String(row.Title || '').trim();
      const description = String(row.Description || '').trim() || undefined;

      if (!id || !name) {
        if (idx < 3) console.warn(`  ⚠ Row ${idx + 2}: Missing TacticID or Title`);
        return;
      }

      tactics.set(id, {
        id,
        name,
        description,
        kpis: []
      });
    } catch (err) {
      console.error(`  ✗ Error parsing Tactic row ${idx + 2}:`, err);
    }
  });

  console.log(`✓ Parsed ${tactics.size} tactics`);
  return tactics;
}

/**
 * Parse KPIs sheet
 */
function parseKPIs(workbook: xlsx.WorkBook): KPI[] {
  const kpis: KPI[] = [];

  const sheet = workbook.Sheets['KPIs'];
  if (!sheet) {
    console.warn('⚠ KPIs sheet not found');
    return kpis;
  }

  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`✓ Reading ${rows.length} rows from KPIs sheet`);
  console.log(`  Columns: ${rows.length > 0 ? Object.keys(rows[0]).join(', ') : 'none'}`);

  rows.forEach((row, idx) => {
    try {
      const id = String(row.KPI_ID || '').trim();
      const name = String(row.Title || '').trim();
      const parentTacticId = String(row.ParentTacticID || '').trim();
      const description = String(row.Description || '').trim();

      if (!id || !name) {
        if (idx < 3) console.warn(`  ⚠ Row ${idx + 2}: Missing KPI_ID or Title`);
        return;
      }

      // Determine metric type
      const metricTypeRaw = String(row.Metric_Type || 'numeric').trim().toLowerCase();
      const metricType: MetricType = metricTypeRaw.includes('milestone') ? 'milestone' : 'numeric';

      // Parse numeric values
      const target = parseFloat(row.Target_Value || '0') || 0;
      const current = parseFloat(row.Current_Value || '0') || 0;
      const unit = String(row.Unit || '').trim() || undefined;

      // Parse owner department
      const leadDept = String(row.Lead_Department || '').trim();
      const ownerDept = leadDept ? leadDept.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined;

      // Parse dates
      const lastUpdated = row.Last_Updated ? new Date(row.Last_Updated).toISOString() : new Date().toISOString();

      // Determine parent IDs from hierarchy
      // ParentTacticID links to Tactic, which links to Strategy, which links to Objective
      const tacticId = parentTacticId || undefined;

      // We'll determine strategyId and objectiveId when building hierarchy
      const kpi: KPI = {
        id,
        name,
        metricType,
        target,
        current,
        unit,
        ownerDept,
        tacticId,
        notes: description || undefined,
        lastUpdated
      };

      kpis.push(kpi);
    } catch (err) {
      console.error(`  ✗ Error parsing KPI row ${idx + 2}:`, err);
    }
  });

  console.log(`✓ Parsed ${kpis.length} KPIs`);
  return kpis;
}

/**
 * Build hierarchical structure by linking entities
 */
function buildHierarchy(
  objectives: Map<string, Objective>,
  strategies: Map<string, Strategy>,
  tactics: Map<string, Tactic>,
  kpis: KPI[],
  workbook: xlsx.WorkBook
): Objective[] {
  // First, link strategies to objectives using ParentObjectiveID
  const strategiesSheet = workbook.Sheets['Strategies'];
  if (strategiesSheet) {
    const rows: any[] = xlsx.utils.sheet_to_json(strategiesSheet);
    rows.forEach(row => {
      const strategyId = String(row.StrategyID || '').trim();
      const parentObjectiveId = String(row.ParentObjectiveID || '').trim();

      if (strategyId && parentObjectiveId && strategies.has(strategyId) && objectives.has(parentObjectiveId)) {
        const strategy = strategies.get(strategyId)!;
        const objective = objectives.get(parentObjectiveId)!;
        objective.strategies.push(strategy);
      }
    });
  }

  // Second, link tactics to strategies using ParentStrategyID
  const tacticsSheet = workbook.Sheets['Tactics'];
  if (tacticsSheet) {
    const rows: any[] = xlsx.utils.sheet_to_json(tacticsSheet);
    rows.forEach(row => {
      const tacticId = String(row.TacticID || '').trim();
      const parentStrategyId = String(row.ParentStrategyID || '').trim();

      if (tacticId && parentStrategyId && tactics.has(tacticId) && strategies.has(parentStrategyId)) {
        const tactic = tactics.get(tacticId)!;
        const strategy = strategies.get(parentStrategyId)!;
        strategy.tactics!.push(tactic);
      }
    });
  }

  // Third, link KPIs to tactics using ParentTacticID
  kpis.forEach(kpi => {
    if (kpi.tacticId && tactics.has(kpi.tacticId)) {
      const tactic = tactics.get(kpi.tacticId)!;
      if (!tactic.kpis) tactic.kpis = [];
      tactic.kpis.push(kpi);

      // Set parent IDs for KPI based on hierarchy
      // Find which strategy this tactic belongs to
      strategies.forEach(strategy => {
        if (strategy.tactics && strategy.tactics.some(t => t.id === kpi.tacticId)) {
          kpi.strategyId = strategy.id;

          // Find which objective this strategy belongs to
          objectives.forEach(objective => {
            if (objective.strategies.some(s => s.id === strategy.id)) {
              kpi.objectiveId = objective.id;
            }
          });
        }
      });
    } else {
      console.warn(`  ⚠ KPI ${kpi.id} has no valid ParentTacticID (${kpi.tacticId || 'empty'})`);
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

  // Check if file exists
  if (!fs.existsSync(SHAREPOINT_TEMPLATE_PATH)) {
    console.error(`✗ File not found: ${SHAREPOINT_TEMPLATE_PATH}`);
    console.error('  Please ensure Updated_SharePoint_Import_Template.xlsx is in the data-source/ folder');
    process.exit(1);
  }

  // Ensure directories exist
  ensureDirectories();

  // Create backup of existing data
  createBackup();

  // Read workbook
  console.log(`\n✓ Reading ${SHAREPOINT_TEMPLATE_PATH}`);
  const workbook = xlsx.readFile(SHAREPOINT_TEMPLATE_PATH);
  console.log(`  Available sheets: ${workbook.SheetNames.join(', ')}\n`);

  // Parse each sheet
  const objectives = parseObjectives(workbook);
  const strategies = parseStrategies(workbook);
  const tactics = parseTactics(workbook);
  const kpis = parseKPIs(workbook);

  // Build hierarchy
  console.log('\n✓ Building hierarchy...');
  const objectivesArray = buildHierarchy(objectives, strategies, tactics, kpis, workbook);

  // Prepare output data
  const objectivesData = {
    objectives: objectivesArray,
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
  const totalStrategies = objectivesArray.reduce((sum, o) => sum + o.strategies.length, 0);
  const totalTactics = objectivesArray.reduce((sum, o) =>
    sum + o.strategies.reduce((sSum, s) => sSum + (s.tactics?.length || 0), 0), 0
  );

  console.log('\n========================================');
  console.log('ETL Summary:');
  console.log(`  Objectives: ${objectivesArray.length}`);
  console.log(`  Strategies: ${totalStrategies}`);
  console.log(`  Tactics: ${totalTactics}`);
  console.log(`  KPIs: ${kpis.length}`);
  console.log('========================================\n');
}

// Run ETL
main();
