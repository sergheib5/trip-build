<template>
  <div class="trip-container">
    <h1>Trip Details</h1>
    <p>Trip ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.trip-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style> 