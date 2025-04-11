<template>
  <TimelineViewTemplate
    :activities="activities"
    :is-expanded="isExpanded"
    :start-date="startDate"
    :end-date="endDate"
    @update:activities="$emit('update:activities', $event)"
  />
</template>

<script setup>
import TimelineViewTemplate from './TimelineViewTemplate.vue'
import { useTimelineView } from './useTimelineView'

const props = defineProps({
  activities: {
    type: Array,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  }
})

defineEmits(['update:activities'])

// Use the composition API
const timelineView = useTimelineView(props)
</script>

<style scoped>
@import './TimelineView.css';
</style> 