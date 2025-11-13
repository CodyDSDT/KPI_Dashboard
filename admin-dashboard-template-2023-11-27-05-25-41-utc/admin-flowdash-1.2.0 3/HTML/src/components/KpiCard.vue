<template>
  <div class="card kpi-card mb-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h6 class="card-title mb-0">{{ kpi.name }}</h6>
        <status-badge :status="status.status" />
      </div>

      <div class="row mt-3">
        <div class="col-6">
          <small class="text-muted">Current</small>
          <div class="h5 mb-0">{{ formatValue(kpi.current) }}</div>
        </div>
        <div class="col-6">
          <small class="text-muted">Target</small>
          <div class="h5 mb-0">{{ formatValue(kpi.target) }}</div>
        </div>
      </div>

      <div class="mt-3">
        <progress-bar :percent="status.percent" :status="status.status" />
      </div>

      <div v-if="kpi.ownerDept && kpi.ownerDept.length" class="mt-3">
        <small class="text-muted">Owner: </small>
        <small>{{ kpi.ownerDept.join(', ') }}</small>
      </div>

      <div v-if="kpi.end" class="mt-2">
        <small class="text-muted">Deadline: </small>
        <small>{{ formatDate(kpi.end) }}</small>
      </div>

      <div v-if="kpi.notes" class="mt-2">
        <small class="text-muted d-block">Notes:</small>
        <small>{{ kpi.notes }}</small>
      </div>
    </div>
  </div>
</template>

<script>
import { kpiStatus } from '../lib/rollup.ts';
import StatusBadge from './StatusBadge.vue';
import ProgressBar from './ProgressBar.vue';

export default {
  name: 'KpiCard',
  components: {
    StatusBadge,
    ProgressBar
  },
  props: {
    kpi: {
      type: Object,
      required: true
    }
  },
  computed: {
    status() {
      return kpiStatus(this.kpi);
    }
  },
  methods: {
    formatValue(value) {
      const unit = this.kpi.unit || '';
      if (this.kpi.metricType === 'milestone') {
        return value ? 'Completed' : 'Not Started';
      }
      return `${value.toLocaleString()}${unit ? ' ' + unit : ''}`;
    },
    formatDate(isoDate) {
      return new Date(isoDate).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.kpi-card {
  transition: box-shadow 0.3s ease;
}

.kpi-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-weight: 600;
  color: #333;
}
</style>
