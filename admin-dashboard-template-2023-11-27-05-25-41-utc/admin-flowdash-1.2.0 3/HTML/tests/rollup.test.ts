/**
 * Unit tests for rollup calculation functions
 *
 * Tests numeric and milestone KPI calculations, edge cases,
 * and roll-up aggregation logic
 */

import {
  kpiPct,
  aggPct,
  tacticPct,
  strategyPct,
  objectivePct,
  getStatusLevel,
  kpiStatus,
  strategyStatus,
  objectiveStatus,
  strategyKPICount,
  objectiveStrategyCount,
  formatPercent
} from '../src/lib/rollup';

import {
  KPI,
  Tactic,
  Strategy,
  Objective
} from '../src/types/strategy';

describe('kpiPct - KPI Percentage Calculation', () => {
  test('calculates numeric KPI percentage correctly', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 100,
      current: 75
    };
    expect(kpiPct(kpi)).toBe(0.75);
  });

  test('caps numeric KPI at 100% when current exceeds target', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 100,
      current: 150
    };
    expect(kpiPct(kpi)).toBe(1.0);
  });

  test('handles zero target for numeric KPI', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 0,
      current: 50
    };
    expect(kpiPct(kpi)).toBe(0);
  });

  test('handles negative current value gracefully', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 100,
      current: -10
    };
    expect(kpiPct(kpi)).toBe(0);
  });

  test('milestone KPI returns 1 when completed', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test Milestone',
      metricType: 'milestone',
      target: 1,
      current: 1
    };
    expect(kpiPct(kpi)).toBe(1);
  });

  test('milestone KPI returns 0 when not completed', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test Milestone',
      metricType: 'milestone',
      target: 1,
      current: 0
    };
    expect(kpiPct(kpi)).toBe(0);
  });

  test('milestone KPI returns 1 for any non-zero current value', () => {
    const kpi: KPI = {
      id: '1.1.1',
      name: 'Test Milestone',
      metricType: 'milestone',
      target: 1,
      current: 5
    };
    expect(kpiPct(kpi)).toBe(1);
  });
});

describe('aggPct - Aggregation Function', () => {
  test('calculates average of percentages correctly', () => {
    const vals = [0.5, 0.75, 1.0];
    expect(aggPct(vals)).toBeCloseTo(0.75);
  });

  test('returns 0 for empty array', () => {
    expect(aggPct([])).toBe(0);
  });

  test('handles single value', () => {
    expect(aggPct([0.85])).toBe(0.85);
  });

  test('handles all zeros', () => {
    expect(aggPct([0, 0, 0])).toBe(0);
  });

  test('handles all ones', () => {
    expect(aggPct([1, 1, 1])).toBe(1);
  });
});

describe('tacticPct - Tactic Percentage Calculation', () => {
  test('calculates tactic percentage from KPIs', () => {
    const tactic: Tactic = {
      id: '1.1.1',
      name: 'Test Tactic',
      kpis: [
        { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 50 },
        { id: '2', name: 'KPI 2', metricType: 'numeric', target: 100, current: 75 }
      ]
    };
    expect(tacticPct(tactic)).toBeCloseTo(0.625);
  });

  test('returns 0 for tactic with no KPIs', () => {
    const tactic: Tactic = {
      id: '1.1.1',
      name: 'Test Tactic',
      kpis: []
    };
    expect(tacticPct(tactic)).toBe(0);
  });

  test('returns 0 for tactic with undefined KPIs', () => {
    const tactic: Tactic = {
      id: '1.1.1',
      name: 'Test Tactic'
    };
    expect(tacticPct(tactic)).toBe(0);
  });
});

describe('strategyPct - Strategy Percentage Calculation', () => {
  test('calculates strategy percentage from direct KPIs only', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      kpis: [
        { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 60 },
        { id: '2', name: 'KPI 2', metricType: 'numeric', target: 100, current: 80 }
      ]
    };
    expect(strategyPct(strategy)).toBeCloseTo(0.70);
  });

  test('calculates strategy percentage from tactics KPIs only', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      tactics: [
        {
          id: '1.1.1',
          name: 'Tactic 1',
          kpis: [
            { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 50 }
          ]
        },
        {
          id: '1.1.2',
          name: 'Tactic 2',
          kpis: [
            { id: '2', name: 'KPI 2', metricType: 'numeric', target: 100, current: 75 }
          ]
        }
      ]
    };
    expect(strategyPct(strategy)).toBeCloseTo(0.625);
  });

  test('calculates strategy percentage from both direct and tactic KPIs', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      kpis: [
        { id: '1', name: 'Direct KPI', metricType: 'numeric', target: 100, current: 80 }
      ],
      tactics: [
        {
          id: '1.1.1',
          name: 'Tactic 1',
          kpis: [
            { id: '2', name: 'Tactic KPI', metricType: 'numeric', target: 100, current: 60 }
          ]
        }
      ]
    };
    expect(strategyPct(strategy)).toBeCloseTo(0.70);
  });

  test('handles strategy with no KPIs or tactics', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      tactics: [],
      kpis: []
    };
    expect(strategyPct(strategy)).toBe(0);
  });
});

describe('objectivePct - Objective Percentage Calculation', () => {
  test('calculates objective percentage from strategies', () => {
    const objective: Objective = {
      id: '1',
      name: 'Test Objective',
      strategies: [
        {
          id: '1.1',
          name: 'Strategy 1',
          kpis: [
            { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 60 }
          ]
        },
        {
          id: '1.2',
          name: 'Strategy 2',
          kpis: [
            { id: '2', name: 'KPI 2', metricType: 'numeric', target: 100, current: 80 }
          ]
        }
      ]
    };
    expect(objectivePct(objective)).toBeCloseTo(0.70);
  });

  test('handles objective with no strategies', () => {
    const objective: Objective = {
      id: '1',
      name: 'Test Objective',
      strategies: []
    };
    expect(objectivePct(objective)).toBe(0);
  });

  test('handles complex objective with nested tactics', () => {
    const objective: Objective = {
      id: '1',
      name: 'Test Objective',
      strategies: [
        {
          id: '1.1',
          name: 'Strategy 1',
          kpis: [
            { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 70 }
          ],
          tactics: [
            {
              id: '1.1.1',
              name: 'Tactic 1',
              kpis: [
                { id: '2', name: 'KPI 2', metricType: 'milestone', target: 1, current: 1 }
              ]
            }
          ]
        }
      ]
    };
    expect(objectivePct(objective)).toBeCloseTo(0.85);
  });
});

describe('getStatusLevel - Status Classification', () => {
  test('returns on-track for 70% or above', () => {
    expect(getStatusLevel(0.70)).toBe('on-track');
    expect(getStatusLevel(0.85)).toBe('on-track');
    expect(getStatusLevel(1.0)).toBe('on-track');
  });

  test('returns at-risk for 40-69%', () => {
    expect(getStatusLevel(0.40)).toBe('at-risk');
    expect(getStatusLevel(0.55)).toBe('at-risk');
    expect(getStatusLevel(0.69)).toBe('at-risk');
  });

  test('returns off-track for below 40%', () => {
    expect(getStatusLevel(0.39)).toBe('off-track');
    expect(getStatusLevel(0.20)).toBe('off-track');
    expect(getStatusLevel(0.0)).toBe('off-track');
  });
});

describe('kpiStatus - KPI Status Object', () => {
  test('returns correct status object for numeric KPI', () => {
    const kpi: KPI = {
      id: '1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 100,
      current: 75
    };
    const status = kpiStatus(kpi);
    expect(status.percent).toBe(0.75);
    expect(status.status).toBe('on-track');
    expect(status.total).toBe(1);
  });

  test('returns correct status object for milestone KPI', () => {
    const kpi: KPI = {
      id: '1',
      name: 'Test Milestone',
      metricType: 'milestone',
      target: 1,
      current: 0
    };
    const status = kpiStatus(kpi);
    expect(status.percent).toBe(0);
    expect(status.status).toBe('off-track');
    expect(status.total).toBe(1);
  });
});

describe('strategyStatus - Strategy Status Object', () => {
  test('returns correct total KPI count', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      kpis: [
        { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 50 },
        { id: '2', name: 'KPI 2', metricType: 'numeric', target: 100, current: 75 }
      ],
      tactics: [
        {
          id: '1.1.1',
          name: 'Tactic 1',
          kpis: [
            { id: '3', name: 'KPI 3', metricType: 'numeric', target: 100, current: 80 }
          ]
        }
      ]
    };
    const status = strategyStatus(strategy);
    expect(status.total).toBe(3);
    expect(status.percent).toBeCloseTo(0.683, 2);
  });
});

describe('Edge Cases', () => {
  test('handles current > target for numeric KPI', () => {
    const kpi: KPI = {
      id: '1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 100,
      current: 120
    };
    expect(kpiPct(kpi)).toBe(1.0);
  });

  test('handles very small percentages', () => {
    const kpi: KPI = {
      id: '1',
      name: 'Test KPI',
      metricType: 'numeric',
      target: 1000000,
      current: 1
    };
    expect(kpiPct(kpi)).toBeCloseTo(0.000001);
  });

  test('handles mixed metric types in strategy', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      kpis: [
        { id: '1', name: 'Numeric KPI', metricType: 'numeric', target: 100, current: 50 },
        { id: '2', name: 'Milestone KPI', metricType: 'milestone', target: 1, current: 1 }
      ]
    };
    expect(strategyPct(strategy)).toBeCloseTo(0.75);
  });
});

describe('Utility Functions', () => {
  test('formatPercent formats correctly', () => {
    expect(formatPercent(0.75, 0)).toBe('75%');
    expect(formatPercent(0.7534, 1)).toBe('75.3%');
    expect(formatPercent(0.7536, 2)).toBe('75.36%');
  });

  test('strategyKPICount counts all KPIs', () => {
    const strategy: Strategy = {
      id: '1.1',
      name: 'Test Strategy',
      kpis: [
        { id: '1', name: 'KPI 1', metricType: 'numeric', target: 100, current: 50 }
      ],
      tactics: [
        {
          id: '1.1.1',
          name: 'Tactic 1',
          kpis: [
            { id: '2', name: 'KPI 2', metricType: 'numeric', target: 100, current: 75 },
            { id: '3', name: 'KPI 3', metricType: 'numeric', target: 100, current: 80 }
          ]
        }
      ]
    };
    expect(strategyKPICount(strategy)).toBe(3);
  });

  test('objectiveStrategyCount counts strategies', () => {
    const objective: Objective = {
      id: '1',
      name: 'Test Objective',
      strategies: [
        { id: '1.1', name: 'Strategy 1', tactics: [], kpis: [] },
        { id: '1.2', name: 'Strategy 2', tactics: [], kpis: [] },
        { id: '1.3', name: 'Strategy 3', tactics: [], kpis: [] }
      ]
    };
    expect(objectiveStrategyCount(objective)).toBe(3);
  });
});
