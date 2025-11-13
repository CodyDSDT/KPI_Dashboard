<template>
  <div class="progress" :style="{ height: height }">
    <div
      class="progress-bar"
      :class="barClass"
      role="progressbar"
      :style="{ width: widthPercent }"
      :aria-valuenow="percent * 100"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span v-if="showLabel">{{ label }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgressBar',
  props: {
    percent: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 1
    },
    status: {
      type: String,
      default: null,
      validator: (value) => ['on-track', 'at-risk', 'off-track', null].includes(value)
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    height: {
      type: String,
      default: '1.5rem'
    }
  },
  computed: {
    widthPercent() {
      return `${this.percent * 100}%`;
    },
    label() {
      return `${Math.round(this.percent * 100)}%`;
    },
    barClass() {
      if (this.status) {
        switch (this.status) {
          case 'on-track':
            return 'bg-success';
          case 'at-risk':
            return 'bg-warning';
          case 'off-track':
            return 'bg-danger';
          default:
            return 'bg-primary';
        }
      }
      return 'bg-primary';
    }
  }
};
</script>

<style scoped>
.progress {
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  transition: width 0.6s ease;
}
</style>
