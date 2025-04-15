<template>
  <div
    class="activity-block"
    :style="style"
    draggable="true"
    @click.stop="$emit('edit', activity)"
    @mousedown.stop="$emit('mousedown', $event)"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend')"
  >
    <div class="activity-content">
      <div class="activity-header">
        <h4 :title="activity.title">{{ activity.title }}</h4>
        <button class="delete-button" @click.stop="$emit('delete', activity)">
          ×
        </button>
      </div>
      <p
        class="time"
        :title="formatTimeRange(activity.startTime, activity.endTime)"
      >
        {{ formatTimeRange(activity.startTime, activity.endTime) }}
      </p>
      <p class="location" :title="activity.location">
        {{ activity.location }}
      </p>
    </div>
    <div
      class="resize-handle"
      @mousedown.stop="$emit('resize-start', $event)"
      @touchstart.stop="$emit('resize-start', $event)"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activity: {
    type: Object,
    required: true,
  },
  isResizing: {
    type: Boolean,
    default: false,
  },
  resizingActivityId: {
    type: String,
    default: null,
  },
})

defineEmits([
  'edit',
  'delete',
  'mousedown',
  'dragstart',
  'dragend',
  'resize-start',
])

const formatTimeRange = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

const style = computed(() => {
  const start = new Date(props.activity.startTime)
  const end = new Date(props.activity.endTime)

  // Calculate position from 6am (0) to 10pm (16 hours)
  const startHour = start.getHours()
  const startMinute = start.getMinutes()
  const endHour = end.getHours()
  const endMinute = end.getMinutes()

  const startPosition = ((startHour - 6) * 60 + startMinute) / 60
  const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60

  return {
    top: `${startPosition * 60}px`,
    height: `${duration * 60}px`,
    border:
      props.isResizing && props.resizingActivityId === props.activity.id
        ? '2px solid #1a73e8'
        : undefined,
  }
})
</script>

<style scoped>
.activity-block {
  position: absolute;
  left: 4px;
  right: 4px;
  background-color: #e8f0fe;
  border-left: 4px solid #1a73e8;
  border-radius: 4px;
  padding: 4px;
  overflow: hidden;
  pointer-events: auto;
  cursor: grab;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow 0.3s ease,
    opacity 0.3s ease,
    border-color 0.2s ease;
  z-index: 50;
  user-select: none;
  touch-action: none;
  will-change: transform, opacity;
}

.activity-block:active {
  cursor: grabbing !important;
  transform: scale(1.02);
  z-index: 100;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.activity-block:hover {
  background-color: #d2e3fc;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #1967d2;
}

.activity-block.dragging {
  opacity: 0.6 !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
  transform: scale(0.95) !important;
  z-index: 150 !important;
  pointer-events: none !important;
  background-color: #c2d7fc !important;
  border-left: 4px solid #1967d2 !important;
}

.activity-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 4px 6px 4px 6px;
}

.activity-content h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.activity-content p {
  margin: 0;
  font-size: 0.7rem;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.activity-content .time {
  margin-bottom: 2px;
}

.activity-content .location {
  margin: 2px 0 0 0;
  font-size: 0.7rem;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  gap: 4px;
}

.activity-header h4 {
  flex: 1;
  min-width: 0;
  margin-right: 4px;
}

.delete-button {
  background: none;
  border: none;
  color: #5f6368;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.3;
  transition: all 0.2s ease;
  width: 14px;
  height: 14px;
  min-width: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0;
  flex-shrink: 0;
}

.delete-button:hover {
  color: #d93025;
  opacity: 0.7;
  transform: scale(1.1);
  background-color: rgba(217, 48, 37, 0.1);
}

.resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.05));
}

.resize-handle:hover,
.resize-handle:active {
  background: linear-gradient(to bottom, transparent, rgba(26, 115, 232, 0.2));
  height: 8px;
}

/* Responsive styles */
@media (max-width: 768px) {
  .activity-content h4 {
    font-size: 0.75rem;
  }

  .activity-content p,
  .activity-content .location {
    font-size: 0.65rem;
  }
}

@media (max-width: 480px) {
  .activity-block {
    padding: 2px 4px;
  }

  .activity-content h4 {
    font-size: 0.7rem;
    margin-bottom: 1px;
  }

  .activity-content p,
  .activity-content .location {
    font-size: 0.6rem;
  }

  .activity-content .location {
    display: none;
  }
}
</style>
