<template>
  <div class="last-updated text-muted">
    <small>
      <i class="fa fa-clock-o mr-1"></i>
      Last updated: {{ formattedDate }}
    </small>
  </div>
</template>

<script>
export default {
  name: 'LastUpdated',
  props: {
    timestamp: {
      type: String,
      required: true
    }
  },
  computed: {
    formattedDate() {
      const date = new Date(this.timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'just now';
      } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  }
};
</script>

<style scoped>
.last-updated {
  font-size: 0.875rem;
}
</style>
