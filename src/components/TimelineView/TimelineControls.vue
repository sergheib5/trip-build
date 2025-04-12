<template>
  <div class="timeline-controls">
    <div class="controls-left">
      <button
        class="expand-button"
        :class="{ active: isExpanded }"
        @click="$emit('toggle-expand')"
      >
        <span class="expand-icon">{{ isExpanded ? '⊖' : '⊕' }}</span>
        <span class="expand-text">
          {{ isExpanded ? 'Compact View' : 'Expand View' }}
        </span>
      </button>
    </div>
    <div class="controls-right">
      <button class="filter-button" @click="$emit('toggle-filters')">
        <span class="filter-icon">⚡</span>
        <span class="filter-text">Filters</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isExpanded: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle-expand', 'toggle-filters'])
</script>

<style scoped>
.timeline-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

.controls-left,
.controls-right {
  display: flex;
  gap: 8px;
}

.expand-button,
.filter-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
  color: #5f6368;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-button:hover,
.filter-button:hover {
  background-color: #f1f3f4;
  border-color: #dadce0;
}

.expand-button.active {
  background-color: #e8f0fe;
  border-color: #1a73e8;
  color: #1a73e8;
}

.expand-icon,
.filter-icon {
  font-size: 1rem;
  line-height: 1;
}

.expand-text,
.filter-text {
  font-weight: 500;
}

@media (max-width: 480px) {
  .expand-text,
  .filter-text {
    display: none;
  }

  .expand-button,
  .filter-button {
    padding: 6px;
  }
}
</style>
