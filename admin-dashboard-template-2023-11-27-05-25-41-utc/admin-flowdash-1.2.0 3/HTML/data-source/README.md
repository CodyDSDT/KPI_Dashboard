# INLC Strategic Plan Source Data

This directory should contain the source Excel and PDF files for the INLC Strategic Dashboard.

## Required Files

Please upload the following files to this directory:

1. **Combined Objectives.xlsx**
   - Contains the authoritative hierarchy of Objectives, Strategies, and Tactics
   - Uses INLC numbering system (e.g., 1, 1.1, 1.1.1)
   - Include columns: ID, Name, Type, Description

2. **INLC_Strategic_Plan_Tracking.xlsx**
   - Contains KPI targets, current values, dates, and owner information
   - Include columns: ID, Name, Metric Type, Target, Current, Unit, Owner, Start Date, End Date, Notes

3. **Combined Objectives.pdf** (Optional)
   - For cross-checking wording and ensuring accuracy

## File Format Requirements

### Combined Objectives.xlsx
- Column names: `ID`, `Name`, `Type` (objective/strategy/tactic), `Description`
- IDs should follow hierarchical numbering: `1`, `1.1`, `1.1.1`, etc.
- Each row represents one entity (objective, strategy, or tactic)

### INLC_Strategic_Plan_Tracking.xlsx
- Column names: `ID`, `Name`/`KPI`, `Metric Type`, `Target`, `Current`, `Unit`, `Owner`/`Owner Dept`, `Start`/`Start Date`, `End`/`End Date`, `Notes`
- Metric Type: "numeric" or "milestone"
- IDs should match hierarchy from Combined Objectives
- Multiple owners can be comma-separated

## After Uploading Files

Run the ETL script to process the data:

```bash
npm run etl
```

This will:
- Parse the Excel files
- Generate `data/objectives.json` and `data/kpis.json`
- Create a backup of any existing data
- Validate the data structure

## Current Status

⚠️ **Source files not yet uploaded**

Sample data has been provided in `data/objectives.json` and `data/kpis.json` for demonstration purposes.

Once you upload the actual INLC Strategic Plan files here, re-run the ETL script to replace the sample data with your real data.
