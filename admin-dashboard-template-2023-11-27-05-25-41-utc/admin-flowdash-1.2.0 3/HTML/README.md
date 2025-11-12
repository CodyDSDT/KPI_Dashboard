# INLC Strategic Dashboard

A comprehensive dashboard for tracking the Indiana Natural Lands Coalition (INLC) Strategic Plan objectives, strategies, tactics, and key performance indicators (KPIs).

## Table of Contents

- [Overview](#overview)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [ETL Process](#etl-process)
- [Dashboard Features](#dashboard-features)
- [Admin Data Update](#admin-data-update)
- [Backup & Recovery](#backup--recovery)
- [Development](#development)
- [Testing](#testing)

## Overview

The INLC Strategic Dashboard provides:

- **Hierarchical tracking** of Objectives → Strategies → Tactics → KPIs
- **Automatic roll-up calculations** showing progress at each level
- **Status indicators** (On Track, At Risk, Off Track) based on completion percentages
- **Admin interface** for non-technical users to update KPI data
- **Data validation** and diff previews before saving changes
- **Automatic backups** on every data update

## Data Model

### Core Entities

The dashboard uses a hierarchical data model:

```
Objective (Top-level goal)
  └─ Strategy (Mid-level plan)
       ├─ KPI (Direct metrics)
       └─ Tactic (Optional sub-level)
            └─ KPI (Tactic-specific metrics)
```

### Type Definitions

Located in `src/types/strategy.ts`:

#### KPI (Key Performance Indicator)
```typescript
type KPI = {
  id: string;              // Hierarchical ID (e.g., "3.5.6.1")
  name: string;
  metricType: "numeric" | "milestone";
  target: number;
  current: number;
  unit?: string;           // "acres", "%", "$", etc.
  ownerDept?: string[];    // ["Stewardship","ED"]
  start?: string;          // ISO8601 date
  end?: string;            // ISO8601 date
  objectiveId?: string;
  strategyId?: string;
  tacticId?: string;
  notes?: string;
  lastUpdated?: string;
};
```

#### Metric Types

1. **Numeric KPIs**: Have a target and current value
   - Progress = `current / target` (capped at 100%)
   - Example: "5,000 acres conserved" (target) vs "3,750 acres" (current) = 75%

2. **Milestone KPIs**: Binary completion (0 or 1)
   - Progress = `current > 0 ? 100% : 0%`
   - Example: "Strategic plan completed" (not started = 0%, completed = 100%)

### Roll-up Calculations

Progress percentages roll up through the hierarchy:

1. **Strategy %** = Average of all KPIs (direct + from tactics)
2. **Objective %** = Average of all Strategy percentages
3. **Overall %** = Average of all Objective percentages

### Status Thresholds

- **On Track**: ≥ 70%
- **At Risk**: 40% - 69%
- **Off Track**: < 40%

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- TypeScript 5.0+

### Installation

```bash
# Install dependencies
npm install

# Run ETL to generate data from source files
npm run etl

# Build the application
npm run production

# Serve locally
npm run serve
```

## ETL Process

The ETL (Extract, Transform, Load) script transforms Excel source files into normalized JSON.

### Source Files

Place these files in `data-source/`:

1. **Combined Objectives.xlsx** - Authoritative hierarchy of Objectives/Strategies/Tactics with INLC numbering
2. **INLC_Strategic_Plan_Tracking.xlsx** - KPI targets, current values, dates, and owners
3. **Combined Objectives.pdf** (optional) - For cross-checking wording

### Running ETL

```bash
npm run etl
```

This will:

1. ✓ Read source Excel files
2. ✓ Extract Objective/Strategy/Tactic hierarchy from Combined Objectives.xlsx
3. ✓ Map KPIs from Tracking spreadsheet to the correct hierarchy nodes
4. ✓ Validate data (no duplicate IDs, required fields present)
5. ✓ Create timestamped backup of existing data in `data/backups/`
6. ✓ Generate `data/objectives.json` (hierarchical structure)
7. ✓ Generate `data/kpis.json` (flat list for quick lookup)

### Output Files

- **data/objectives.json** - Hierarchical structure with nested strategies, tactics, and KPIs
- **data/kpis.json** - Flat list of all KPIs for quick lookup by ID
- **data/backups/backup_TIMESTAMP.json** - Timestamped backup of previous data

### ETL Safety Features

- **Idempotent**: Safe to run multiple times
- **Automatic backups**: Creates backup before overwriting
- **Validation**: Checks for duplicate IDs and missing required fields
- **Logging**: Clear console output showing what was processed

### Mapping Logic

The ETL uses the ID hierarchy to link KPIs:

- `"1"` → Objective
- `"1.2"` → Strategy under Objective 1
- `"1.2.3"` → Tactic under Strategy 1.2
- `"1.2.3.1"` → KPI under Tactic 1.2.3

If a KPI ID doesn't match any Tactic, it's attached directly to the Strategy.

## Dashboard Features

### Pages

1. **Objectives Overview** (`/fixed-objectives.html`)
   - Grid of all objectives with roll-up percentages
   - Status badges (On Track / At Risk / Off Track)
   - Search and filter functionality
   - Summary statistics

2. **Objective Detail** (`/fixed-objective-detail.html?id=1`)
   - Detailed view of a single objective
   - List of strategies with progress bars
   - Drill-down to strategy details

3. **Strategy Detail** (`/fixed-strategy-detail.html?id=1.2`)
   - Strategy-level metrics and KPIs
   - Tactics (if present) with their KPIs
   - Progress visualizations

4. **Admin Data Update** (`/fixed-admin-data-update.html`)
   - Non-technical interface for updating KPI data
   - See [Admin Data Update](#admin-data-update) section

### UI Components

Reusable Vue components in `src/components/`:

- **ProgressBar.vue** - Visual progress indicator with status colors
- **StatusBadge.vue** - Color-coded status labels
- **KpiCard.vue** - Card display for individual KPIs
- **EntityBreadcrumbs.vue** - Navigation breadcrumbs
- **LastUpdated.vue** - Relative timestamp display

## Admin Data Update

The Admin Data Update page provides a safe, user-friendly interface for editing KPI data.

### Features

#### Entity Picker
1. Select Objective from dropdown
2. Select Strategy (enabled after objective selection)
3. Optionally select Tactic (if applicable)
4. Select specific KPI to edit

#### KPI Editor

**Numeric KPIs:**
- Edit Target value (must be ≥ 0)
- Edit Current value (must be ≥ 0)
- Set Unit (e.g., "acres", "%", "$")
- Warning if current > target

**Milestone KPIs:**
- Toggle "Completed" checkbox
- Sets current to 1 (completed) or 0 (not started)

**Common Fields:**
- Owner Department(s) - comma-separated list
- Start Date and End Date
- Notes/Comments

#### Live Preview
- Real-time progress percentage calculation
- Status badge updates as you type
- Warnings for validation issues

#### Save Process

1. Click "Save Changes"
2. Review diff showing old vs. new values
3. Confirm changes
4. System creates timestamped backup
5. Updates both `objectives.json` and `kpis.json`
6. Success notification

#### Safety Features

- **Unsaved Changes Guard**: Warning if you try to leave with unsaved changes
- **Validation**: Target and current must be ≥ 0
- **Diff Preview**: See exactly what will change before saving
- **Cancel/Reset**: Easily discard changes
- **Automatic Backups**: Every save creates a backup

### CSV Import/Export

**Export**: Download all KPI data as CSV for bulk editing in Excel

**Import**: Upload edited CSV to batch-update multiple KPIs
- Validates CSV structure
- Shows preview of changes before applying
- Creates backup before import

### User Roles

- **Admin**: Full edit access to all KPIs
- **Viewer**: Read-only access (edit controls hidden)

*Note: Role management should be implemented in your authentication system*

## Backup & Recovery

### Automatic Backups

Backups are created automatically:

1. **Before ETL runs** - `data/backups/backup_YYYY-MM-DDTHH-mm-ss.json`
2. **Before admin saves** - `data/backups/backup_YYYY-MM-DDTHH-mm-ss.json`

### Backup Format

```json
{
  "objectives": { ... },
  "kpis": { ... }
}
```

### Manual Recovery

To restore from a backup:

```bash
# Copy backup files back to main location
cp data/backups/backup_2025-11-12T10-30-00.json data/objectives.json
cp data/backups/backup_2025-11-12T10-30-00.json data/kpis.json
```

Or use the backup data directly by modifying the fetch URLs in the JavaScript files.

## Development

### Project Structure

```
├── data/                    # JSON data files
│   ├── objectives.json
│   ├── kpis.json
│   └── backups/            # Timestamped backups
├── data-source/            # Excel/PDF source files
│   ├── Combined Objectives.xlsx
│   ├── Combined Objectives.pdf
│   └── INLC_Strategic_Plan_Tracking.xlsx
├── scripts/
│   └── etl.ts              # ETL script
├── src/
│   ├── components/         # Vue components
│   │   ├── ProgressBar.vue
│   │   ├── StatusBadge.vue
│   │   ├── KpiCard.vue
│   │   ├── EntityBreadcrumbs.vue
│   │   └── LastUpdated.vue
│   ├── html/
│   │   ├── layouts/        # Page layouts
│   │   └── pages/          # Dashboard pages
│   ├── js/
│   │   ├── rollup.js       # Roll-up calculations
│   │   ├── objectives.js   # Objectives page
│   │   ├── objective-detail.js
│   │   ├── strategy-detail.js
│   │   └── admin-data-update.js
│   ├── lib/
│   │   └── rollup.ts       # Server-side rollup utilities
│   └── types/
│       └── strategy.ts     # TypeScript type definitions
├── tests/
│   └── rollup.test.ts      # Unit tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Build Scripts

```bash
# Development build with watch
npm run watch

# Production build (minified)
npm run production

# Type checking only
npm run type-check

# Run ETL
npm run etl

# Run tests
npm test
```

### Adding New KPIs

1. Add entry to `INLC_Strategic_Plan_Tracking.xlsx` with unique ID
2. Ensure ID follows hierarchy (e.g., `"3.2.1.4"` under Strategy 3.2, Tactic 3.2.1)
3. Run `npm run etl` to regenerate JSON
4. KPI will appear in dashboard automatically

### Customizing Status Thresholds

Edit `src/lib/rollup.ts` and `src/js/rollup.js`:

```typescript
const THRESHOLD_ON_TRACK = 0.70;  // Change to 0.80 for 80%
const THRESHOLD_AT_RISK = 0.40;   // Change to 0.50 for 50%
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Test Coverage

Tests in `tests/rollup.test.ts` cover:

- ✓ Numeric KPI calculations (normal, edge cases)
- ✓ Milestone KPI calculations
- ✓ Target = 0 handling
- ✓ Current > target handling
- ✓ Negative values
- ✓ Aggregation functions
- ✓ Tactic roll-ups
- ✓ Strategy roll-ups (direct KPIs + tactics)
- ✓ Objective roll-ups
- ✓ Status threshold classification
- ✓ Mixed metric types
- ✓ Empty arrays and missing data

### Adding Tests

Follow the Jest pattern in `tests/rollup.test.ts`:

```typescript
describe('Feature Name', () => {
  test('specific behavior', () => {
    const input = ...;
    const result = functionUnderTest(input);
    expect(result).toBe(expectedValue);
  });
});
```

## Troubleshooting

### ETL Issues

**"No objectives found"**
- Ensure source files are in `data-source/` directory
- Check file names match exactly (case-sensitive)
- Verify Excel files are not corrupted

**"Failed to load objectives data"**
- Run `npm run etl` to generate JSON files
- Check console for ETL errors
- Verify `data/` directory exists

### Dashboard Display Issues

**Blank pages or "Loading..." stuck**
- Check browser console for errors
- Verify `data/objectives.json` and `data/kpis.json` exist
- Ensure JSON files are valid (use JSONLint)

**Incorrect percentages**
- Re-run ETL: `npm run etl`
- Check for data validation errors in console
- Verify target values are not zero

### Build Issues

**TypeScript errors**
- Run `npm run type-check` to see all errors
- Ensure all dependencies are installed: `npm install`

**Webpack errors**
- Clear dist folder: `rm -rf dist`
- Rebuild: `npm run production`

## Support

For issues or questions:

1. Check this README
2. Review console logs for errors
3. Check `data/backups/` for recent backups
4. Contact the development team

## License

UNLICENSED - Internal use only

---

**Last Updated**: November 2025
**Version**: 1.0.0
