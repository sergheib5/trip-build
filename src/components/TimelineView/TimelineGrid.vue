<template>
  <div class="time-grid">
    <div class="time-labels">
      <div v-for="hour in hours" :key="hour" class="time-label">
        {{ formatHour(hour) }}
      </div>
    </div>

    <div class="day-columns" :class="{ 'expanded-columns': isExpanded }">
      <div
        v-for="day in visibleDays"
        :key="day.date"
        class="day-column"
        :class="{
          'current-day': isCurrentDay(day.date),
          'day-drag-over':
            isDraggingOver && dragOverDay === day.date.toDateString(),
        }"
        @dragover.prevent="onDragOver($event, day.date)"
        @drop.prevent="onDrop($event, day.date)"
        @dragleave="onDragLeave($event)"
      >
        <div class="time-slots">
          <div
            v-for="hour in hours"
            :key="hour"
            class="time-slot"
            :class="{
              'drag-over':
                isDraggingOver &&
                dragOverDay === day.date.toDateString() &&
                Math.floor(dragOverHour) === hour,
            }"
            @dragover.prevent="onDragOver($event, day.date, hour)"
            @drop.prevent="onDrop($event, day.date, hour)"
            @dragleave="onDragLeave($event)"
          ></div>
        </div>

        <!-- Add drag preview overlay -->
        <div
          v-if="
            dragPreviewPosition.visible &&
            dragPreviewPosition.day === day.date.toDateString()
          "
          class="drag-preview"
          :style="{
            top: dragPreviewPosition.top + 'px',
            height: dragPreviewPosition.height + 'px',
          }"
        ></div>

        <!-- Activities for this day -->
        <div class="activities">
          <TimelineActivity
            v-for="activity in getActivitiesForDay(day.date)"
            :key="activity.id"
            :activity="activity"
            :is-resizing="isResizing"
            :resizing-activity-id="resizingActivity?.id"
            @edit="$emit('edit-activity', activity)"
            @delete="$emit('delete-activity', activity)"
            @mousedown="$emit('activity-mousedown', $event, activity)"
            @dragstart="$emit('activity-dragstart', $event, activity)"
            @dragend="$emit('activity-dragend')"
            @resize-start="$emit('resize-start', $event, activity)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TimelineActivity from './TimelineActivity.vue'

const props = defineProps({
  visibleDays: {
    type: Array,
    required: true,
  },
  currentDate: {
    type: Date,
    required: true,
  },
  activities: {
    type: Array,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  isResizing: {
    type: Boolean,
    default: false,
  },
  resizingActivity: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'edit-activity',
  'delete-activity',
  'activity-mousedown',
  'activity-dragstart',
  'activity-dragend',
  'resize-start',
  'drop',
])

// Generate hours from 6am to 10pm
const hours = computed(() => {
  const hours = []
  for (let i = 6; i <= 22; i++) {
    hours.push(i)
  }
  return hours
})

// Format hour for display (e.g., "6 AM")
const formatHour = hour => {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

// Check if a date is the current selected date
const isCurrentDay = date => {
  return date.toDateString() === props.currentDate.toDateString()
}

// Get activities for a specific day
const getActivitiesForDay = date => {
  return props.activities.filter(activity => {
    const activityDate = new Date(activity.startTime)
    return activityDate.toDateString() === date.toDateString()
  })
}

// Drag state
const isDraggingOver = ref(false)
const dragOverDay = ref(null)
const dragOverHour = ref(null)

// Add an overlay to show where an activity will be placed when dragging
const dragPreviewPosition = ref({
  top: 0,
  height: 0,
  day: null,
  visible: false,
})

const onDragOver = (event, date, hour = null) => {
  event.preventDefault()
  event.stopPropagation()

  // Set the dropEffect to move
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }

  // Update the drag over state with the current target
  isDraggingOver.value = true
  dragOverDay.value = date.toDateString()

  // Calculate more precise time position from mouse y-position
  if (hour !== null) {
    // Get mouse position in the time slot
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeY = event.clientY - rect.top

    // Calculate minutes within the hour (0-59)
    const minutesInHour = Math.floor((relativeY / rect.height) * 60)

    // Snap to TIME_INTERVAL
    const snappedMinutes = Math.round(minutesInHour / 30) * 30

    // Store the hour with precise minute information
    dragOverHour.value = hour + snappedMinutes / 60
  } else {
    // If dragged over day column but not a specific time slot,
    // use either the current mouse position or a reasonable default
    if (event.clientY) {
      const columnRect = event.currentTarget.getBoundingClientRect()
      const relativeY = event.clientY - columnRect.top

      // Convert to hours (assuming 60px per hour)
      const hours = relativeY / 60
      const hourValue = Math.max(6, Math.min(22, Math.floor(hours) + 6))
      const minutes = Math.round((hours % 1) * 60)
      const snappedMinutes = Math.round(minutes / 30) * 30

      dragOverHour.value = hourValue + snappedMinutes / 60
    } else {
      // Use noon as default if we can't determine position
      dragOverHour.value = 12
    }
  }
}

const onDragLeave = event => {
  // Only reset if we're leaving to something that isn't a valid drop target
  const relatedTarget = event.relatedTarget
  if (
    !relatedTarget ||
    (!relatedTarget.classList.contains('time-slot') &&
      !relatedTarget.classList.contains('day-column') &&
      !relatedTarget.classList.contains('activity-block'))
  ) {
    isDraggingOver.value = false
    dragOverDay.value = null
    dragOverHour.value = null

    // Hide the preview
    dragPreviewPosition.value.visible = false
  }
}

const onDrop = (event, date, hour = null) => {
  event.preventDefault()
  event.stopPropagation()
  const dropHour = isDraggingOver.value ? dragOverHour.value : hour || 12
  isDraggingOver.value = false
  dragOverDay.value = null
  dragOverHour.value = null
  dragPreviewPosition.value.visible = false
  emit('drop', { event, date, hour: dropHour })
}
</script>

<style scoped>
.time-grid {
  flex: 1;
  display: flex;
  overflow: auto;
  width: 100%;
}

.time-labels {
  width: 60px;
  flex-shrink: 0;
  padding: 8px 0;
  border-right: 1px solid #e0e0e0;
}

.time-label {
  height: 60px;
  padding-right: 8px;
  text-align: right;
  font-size: 0.75rem;
  color: #5f6368;
  position: relative;
}

.day-columns {
  flex: 1;
  display: flex;
  width: 100%;
  table-layout: fixed;
  transition: all 0.3s ease;
}

.day-column {
  flex: 1;
  position: relative;
  border-right: 1px solid #e0e0e0;
  min-width: 120px;
  transition: all 0.3s ease;
}

.day-column:last-child {
  border-right: none;
}

.day-column.current-day {
  background-color: #e8f0fe;
  color: #1a73e8;
}

.day-column.day-drag-over {
  background-color: rgba(66, 135, 245, 0.15);
  box-shadow: inset 0 0 0 2px #4287f5;
}

.time-slots {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.time-slot {
  height: 60px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  z-index: 1;
  transition: background-color 0.2s ease;
}

.time-slot:hover {
  background-color: rgba(66, 135, 245, 0.1);
}

.time-slot.drag-over {
  background-color: rgba(66, 135, 245, 0.4);
  border: 2px dashed #4287f5;
  box-shadow: inset 0 0 5px rgba(66, 135, 245, 0.5);
  z-index: 2;
}

.activities {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 3;
  overflow: visible;
}

.drag-preview {
  position: absolute;
  left: 4px;
  right: 4px;
  background-color: rgba(26, 115, 232, 0.2);
  border-left: 4px solid rgba(26, 115, 232, 0.5);
  border-radius: 4px;
  z-index: 40;
  pointer-events: none;
  border: 2px dashed #1a73e8;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.4);
  }

  70% {
    box-shadow: 0 0 0 4px rgba(26, 115, 232, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(26, 115, 232, 0);
  }
}

.expanded-columns .day-column {
  min-width: 90px;
}

@media (max-width: 768px) {
  .expanded-columns .day-column {
    min-width: 70px;
  }
}
</style>
