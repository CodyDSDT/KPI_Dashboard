<template>
  <span class="badge" :class="badgeClass">
    <i v-if="showIcon" :class="iconClass" class="mr-1"></i>
    {{ label }}
  </span>
</template>

<script>
export default {
  name: 'StatusBadge',
  props: {
    status: {
      type: String,
      required: true,
      validator: (value) => ['on-track', 'at-risk', 'off-track'].includes(value)
    },
    showIcon: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    badgeClass() {
      switch (this.status) {
        case 'on-track':
          return 'badge-success';
        case 'at-risk':
          return 'badge-warning';
        case 'off-track':
          return 'badge-danger';
        default:
          return 'badge-secondary';
      }
    },
    iconClass() {
      switch (this.status) {
        case 'on-track':
          return 'fa fa-check-circle';
        case 'at-risk':
          return 'fa fa-exclamation-triangle';
        case 'off-track':
          return 'fa fa-times-circle';
        default:
          return 'fa fa-question-circle';
      }
    },
    label() {
      switch (this.status) {
        case 'on-track':
          return 'On Track';
        case 'at-risk':
          return 'At Risk';
        case 'off-track':
          return 'Off Track';
        default:
          return 'Unknown';
      }
    }
  }
};
</script>

<style scoped>
.badge {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.25rem;
}
</style>
