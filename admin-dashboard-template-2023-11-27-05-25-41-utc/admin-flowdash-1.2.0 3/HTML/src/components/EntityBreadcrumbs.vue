<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <a href="/objectives">Objectives</a>
      </li>
      <li v-if="objective" class="breadcrumb-item" :class="{ active: !strategy }">
        <a v-if="strategy" :href="`/objectives/${objective.id}`">{{ objective.name }}</a>
        <span v-else>{{ objective.name }}</span>
      </li>
      <li v-if="strategy" class="breadcrumb-item active">
        {{ strategy.name }}
      </li>
    </ol>
  </nav>
</template>

<script>
export default {
  name: 'EntityBreadcrumbs',
  props: {
    objective: {
      type: Object,
      default: null
    },
    strategy: {
      type: Object,
      default: null
    }
  }
};
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
}

.breadcrumb-item a {
  color: #007bff;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}
</style>
