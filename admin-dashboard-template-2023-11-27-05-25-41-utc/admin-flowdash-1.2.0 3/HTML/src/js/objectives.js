/**
 * Objectives Overview Page
 * Displays all objectives with roll-up metrics and status
 */

import {
  objectivePct,
  objectiveKPICount,
  getStatusLevel,
  getStatusClass,
  getStatusLabel,
  formatPercent,
  aggPct
} from './rollup.js';

let objectivesData = null;

/**
 * Load objectives data from JSON
 */
async function loadObjectivesData() {
  try {
    const response = await fetch('/data/objectives.json');
    if (!response.ok) {
      throw new Error('Failed to load objectives data');
    }
    objectivesData = await response.json();
    return objectivesData;
  } catch (error) {
    console.error('Error loading objectives:', error);
    showError('Failed to load objectives data. Please ensure ETL has been run.');
    return null;
  }
}

/**
 * Initialize the page
 */
async function init() {
  const data = await loadObjectivesData();

  if (!data || !data.objectives) {
    return;
  }

  updateSummaryCards(data);
  renderObjectivesList(data.objectives);
  setupSearch(data.objectives);
  updateLastSync(data.lastSync);
}

/**
 * Update summary cards at the top of the page
 */
function updateSummaryCards(data) {
  const objectives = data.objectives;
  const totalObjectives = objectives.length;
  const totalStrategies = objectives.reduce((sum, o) => sum + o.strategies.length, 0);
  const totalKPIs = objectives.reduce((sum, o) => sum + objectiveKPICount(o), 0);
  const overallProgress = aggPct(objectives.map(objectivePct));

  document.getElementById('totalObjectives').textContent = totalObjectives;
  document.getElementById('totalStrategies').textContent = totalStrategies;
  document.getElementById('totalKPIs').textContent = totalKPIs;
  document.getElementById('overallProgress').textContent = formatPercent(overallProgress, 0);
}

/**
 * Render the objectives list
 */
function renderObjectivesList(objectives) {
  const listContainer = document.getElementById('objectivesList');

  if (!objectives || objectives.length === 0) {
    listContainer.innerHTML = `
      <div class="list-group-item text-center py-5">
        <p class="text-muted mb-0">No objectives found. Please run the ETL script to import data.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = objectives.map(obj => {
    const percent = objectivePct(obj);
    const status = getStatusLevel(percent);
    const kpiCount = objectiveKPICount(obj);
    const strategyCount = obj.strategies.length;

    return `
      <a href="fixed-objective-detail.html?id=${encodeURIComponent(obj.id)}"
         class="list-group-item list-group-item-action">
        <div class="d-flex w-100 justify-content-between align-items-start mb-2">
          <div class="flex-fill">
            <h5 class="mb-1">
              <span class="badge badge-light mr-2">${obj.id}</span>
              ${escapeHtml(obj.name)}
            </h5>
            ${obj.description ? `<p class="text-muted mb-2">${escapeHtml(obj.description)}</p>` : ''}
          </div>
          <span class="badge ${getStatusClass(status)} ml-3">
            ${getStatusLabel(status)}
          </span>
        </div>

        <div class="progress mb-2" style="height: 12px;">
          <div class="progress-bar ${getStatusClass(status).replace('badge-', 'bg-')}"
               role="progressbar"
               style="width: ${percent * 100}%"
               aria-valuenow="${percent * 100}"
               aria-valuemin="0"
               aria-valuemax="100">
            <small class="text-white font-weight-bold">${formatPercent(percent, 0)}</small>
          </div>
        </div>

        <div class="d-flex justify-content-between">
          <small class="text-muted">
            <i class="fa fa-sitemap mr-1"></i>
            ${strategyCount} ${strategyCount === 1 ? 'Strategy' : 'Strategies'}
          </small>
          <small class="text-muted">
            <i class="fa fa-list mr-1"></i>
            ${kpiCount} ${kpiCount === 1 ? 'KPI' : 'KPIs'}
          </small>
          <small class="text-muted">
            <i class="fa fa-arrow-right mr-1"></i>
            View Details
          </small>
        </div>
      </a>
    `;
  }).join('');
}

/**
 * Setup search functionality
 */
function setupSearch(objectives) {
  const searchInput = document.getElementById('searchInput');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    const filtered = objectives.filter(obj => {
      return obj.name.toLowerCase().includes(searchTerm) ||
             obj.id.toLowerCase().includes(searchTerm) ||
             (obj.description && obj.description.toLowerCase().includes(searchTerm));
    });

    renderObjectivesList(filtered);
  });
}

/**
 * Update last sync timestamp
 */
function updateLastSync(timestamp) {
  if (!timestamp) return;

  const lastSyncEl = document.getElementById('lastSync');
  if (lastSyncEl) {
    lastSyncEl.textContent = formatTimestamp(timestamp);
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

/**
 * Show error message
 */
function showError(message) {
  const listContainer = document.getElementById('objectivesList');
  listContainer.innerHTML = `
    <div class="list-group-item">
      <div class="alert alert-danger mb-0" role="alert">
        <i class="fa fa-exclamation-triangle mr-2"></i>
        ${escapeHtml(message)}
      </div>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
