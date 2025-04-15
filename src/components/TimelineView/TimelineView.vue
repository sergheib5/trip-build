<template>
  <div class="timeline-container">
    <div ref="calendarView" class="calendar-view">
      <!-- Calendar grid -->
      <div class="calendar-grid" :class="{ 'expanded-view': isExpanded }">
        <!-- Day headers -->
        <div class="day-headers">
          <div class="time-header-spacer">
            <button class="nav-button prev-button" @click="previousWeek">
              &lt;
            </button>
          </div>
          <div
            v-for="day in visibleDays"
            :key="day.date"
            class="day-header"
            :class="{ 'current-day': isCurrentDay(day.date) }"
          >
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-number">{{ day.dayNumber }}</div>
          </div>
          <button class="nav-button next-button" @click="nextWeek">&gt;</button>
        </div>

        <!-- Time grid -->
        <div ref="timeGrid" class="time-grid">
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
                <div
                  v-for="activity in getActivitiesForDay(day.date)"
                  :key="activity.id"
                  class="activity-block"
                  :style="getActivityStyle(activity)"
                  draggable="true"
                  @click.stop="editActivity(activity)"
                  @mousedown.stop="onActivityMouseDown($event, activity)"
                  @dragstart="onActivityDragStart($event, activity)"
                  @dragend="onDragEnd"
                >
                  <div class="activity-content">
                    <div class="activity-header">
                      <h4 :title="activity.title">{{ activity.title }}</h4>
                      <button
                        class="delete-button"
                        @click.stop="deleteActivity(activity)"
                      >
                        ×
                      </button>
                    </div>
                    <p
                      class="time"
                      :title="
                        formatTimeRange(activity.startTime, activity.endTime)
                      "
                    >
                      {{
                        formatTimeRange(activity.startTime, activity.endTime)
                      }}
                    </p>
                    <p class="location" :title="activity.location">
                      {{ activity.location }}
                    </p>
                  </div>
                  <!-- Add resize handle -->
                  <div
                    class="resize-handle"
                    @mousedown.stop="startResize($event, activity)"
                    @touchstart.stop="startResize($event, activity)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
  },
})

const emit = defineEmits(['update:activities'])

const calendarView = ref(null)
const timeGrid = ref(null)

const {
  visibleDays,
  hours,
  isCurrentDay,
  previousWeek,
  nextWeek,
  formatHour,
  formatTimeRange,
  getActivitiesForDay,
  getActivityStyle,
  editActivity,
  deleteActivity,
  onDragOver,
  onDrop,
  onDragLeave,
  onActivityMouseDown,
  onActivityDragStart,
  onDragEnd,
  startResize,
  isDraggingOver,
  dragOverDay,
  dragOverHour,
  dragPreviewPosition,
  defaultScrollPosition,
} = useTimelineView(props, emit)

onMounted(() => {
  if (calendarView.value) {
    calendarView.value.scrollTop = defaultScrollPosition.value
  }
})
</script>

<style scoped>
@import './TimelineView.css';
</style>
