<template>
  <div class="timeline-container">
    <div class="calendar-view">
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
            :class="{ 'current-day': isCurrentDay(day.date) }">
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-number">{{ day.dayNumber }}</div>
          </div>
          <button class="nav-button next-button" @click="nextWeek">&gt;</button>
        </div>

        <!-- Time grid -->
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
              @dragleave="onDragLeave($event)">
              <div class="time-slots">
                <div
                  v-for="hour in hours"
                  :key="hour"
                  class="time-slot"
                  :class="{
                    'drag-over': isDraggingOver &&
                      dragOverDay === day.date.toDateString() &&
                      Math.floor(dragOverHour) === hour
                  }"
                  @dragover.prevent="onDragOver($event, day.date, hour)"
                  @drop.prevent="onDrop($event, day.date, hour)"
                  @dragleave="onDragLeave($event)"></div>
              </div>

              <!-- Add drag preview overlay -->
              <div v-if="dragPreviewPosition.visible &&
                dragPreviewPosition.day === day.date.toDateString()" class="drag-preview" :style="{
                  top: dragPreviewPosition.top + 'px',
                  height: dragPreviewPosition.height + 'px',
                }"></div>

              <!-- Activities for this day -->
              <div class="activities">
                <div v-for="activity in getActivitiesForDay(day.date)" :key="activity.id" class="activity-block"
                  :style="getActivityStyle(activity)" @click.stop="editActivity(activity)" draggable="true"
                  @mousedown.stop="onActivityMouseDown($event, activity)"
                  @dragstart="onActivityDragStart($event, activity)" @dragend="onDragEnd">
                  <div class="activity-content">
                    <div class="activity-header">
                      <h4 :title="activity.title">{{ activity.title }}</h4>
                      <button class="delete-button" @click.stop="deleteActivity(activity)">
                        ×
                      </button>
                    </div>
                    <p class="time" :title="formatTimeRange(activity.startTime, activity.endTime)">
                      {{ formatTimeRange(activity.startTime, activity.endTime) }}
                    </p>
                    <p class="location" :title="activity.location">
                      {{ activity.location }}
                    </p>
                  </div>
                  <!-- Add resize handle -->
                  <div class="resize-handle" @mousedown.stop="startResize($event, activity)"
                    @touchstart.stop="startResize($event, activity)"></div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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

const emit = defineEmits(['update:activities'])

// Date state
const currentDate = ref(new Date())

// Watch for changes in date range
watch(
  () => [props.startDate, props.endDate],
  ([newStartDate, newEndDate]) => {
    if (newStartDate && newEndDate) {
      // Reset current date to start of range when range changes
      currentDate.value = new Date(newStartDate)
    }
  },
  { immediate: true }
)

// Number of days to show based on expanded state
const DAYS_TO_SHOW = computed(() => (props.isExpanded ? 7 : 4))

// Generate hours from 6am to 10pm
const hours = computed(() => {
  const hours = []
  for (let i = 6; i <= 22; i++) {
    hours.push(i)
  }
  return hours
})

// Get visible days
const visibleDays = computed(() => {
  const days = []

  // If a date range is selected, use it for calculation
  if (props.startDate && props.endDate) {
    // Calculate total days in the range
    const timeDiff = props.endDate.getTime() - props.startDate.getTime()
    const segmentStart = new Date(currentDate.value)

    // Ensure we stay within the selected range
    if (segmentStart < props.startDate) {
      segmentStart.setTime(props.startDate.getTime())
    } else if (segmentStart > props.endDate) {
      segmentStart.setTime(props.endDate.getTime())
    }

    // Calculate how many days we can display
    const daysToEnd = Math.ceil(
      (props.endDate.getTime() - segmentStart.getTime()) / (1000 * 3600 * 24)
    ) + 1
    const daysCount = Math.min(daysToEnd, DAYS_TO_SHOW.value)

    // Create days within the range
    for (let i = 0; i < daysCount; i++) {
      const day = new Date(segmentStart)
      day.setDate(day.getDate() + i)

      // Don't go beyond end date
      if (day > props.endDate) break

      days.push({
        date: day,
        dayName: day.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNumber: day.getDate(),
      })
    }
  } else {
    // No date range selected, use default behavior
    const startPoint = currentDate.value
    const startDayOffset = -Math.floor(DAYS_TO_SHOW.value / 2)

    const viewStartDate = new Date(startPoint)
    viewStartDate.setDate(viewStartDate.getDate() + startDayOffset)

    // Create DAYS_TO_SHOW days
    for (let i = 0; i < DAYS_TO_SHOW.value; i++) {
      const day = new Date(viewStartDate)
      day.setDate(day.getDate() + i)

      days.push({
        date: day,
        dayName: day.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNumber: day.getDate(),
      })
    }
  }

  return days
})

// Check if a date is the current selected date
const isCurrentDay = date => {
  return date.toDateString() === currentDate.value.toDateString()
}

// Navigation functions
const previousWeek = () => {
  if (props.startDate && props.endDate) {
    // Calculate new current date by moving back DAYS_TO_SHOW days
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() - DAYS_TO_SHOW.value)

    // Don't navigate before start date
    if (newDate < props.startDate) {
      currentDate.value = new Date(props.startDate)
    } else {
      currentDate.value = newDate
    }
  } else {
    // Use the original week navigation
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() - DAYS_TO_SHOW.value)
    currentDate.value = newDate
  }
}

const nextWeek = () => {
  if (props.startDate && props.endDate) {
    // Calculate new current date by moving forward DAYS_TO_SHOW days
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() + DAYS_TO_SHOW.value)

    // Don't navigate past end date
    const maxStartDate = new Date(props.endDate)
    maxStartDate.setDate(maxStartDate.getDate() - DAYS_TO_SHOW.value + 1)

    if (newDate > maxStartDate) {
      currentDate.value = maxStartDate
    } else {
      currentDate.value = newDate
    }
  } else {
    // Use the original week navigation
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() + DAYS_TO_SHOW.value)
    currentDate.value = newDate
  }
}

// Get activities for a specific day
const getActivitiesForDay = date => {
  return props.activities.filter(activity => {
    const activityDate = new Date(activity.startTime)
    return activityDate.toDateString() === date.toDateString()
  })
}

// Format hour for display (e.g., "6 AM")
const formatHour = hour => {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

// Format time range for activity display
const formatTimeRange = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

// Calculate activity block position and height
const getActivityStyle = activity => {
  const start = new Date(activity.startTime)
  const end = new Date(activity.endTime)

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
    // Add visual indication if this activity is being resized
    border: isResizing.value && resizingActivity.value?.id === activity.id
      ? '2px solid #1a73e8'
      : undefined
  }
}

// Handle activity click
const editActivity = activity => {
  // You can implement alternative handling here
}

// Drag state
const isDraggingOver = ref(false)
const dragOverDay = ref(null)
const dragOverHour = ref(null)
const isDragging = ref(false)
const currentDraggedActivity = ref(null)

// Add refs for dragging functionality
const isDraggingActivity = ref(false)
const dragStartPosition = ref({ x: 0, y: 0 })
const dragStartTime = ref(null)
const TIME_INTERVAL = 30 // minutes

// Add refs for resize functionality
const isResizing = ref(false)
const resizingActivity = ref(null)
const resizeStartY = ref(0)
const initialActivityHeight = ref(0)

// Add an overlay to show where an activity will be placed when dragging
const dragPreviewPosition = ref({
  top: 0,
  height: 0,
  day: null,
  visible: false,
})

// Document-level drag event handlers
const handleDragStart = () => {
  isDragging.value = true
  document.body.classList.add('calendar-dragging-active')
}

const handleDragEnd = () => {
  isDragging.value = false
  document.body.classList.remove('calendar-dragging-active')
  // Reset drag over state
  isDraggingOver.value = false
  dragOverDay.value = null
  dragOverHour.value = null
}

// Add and remove event listeners
onMounted(() => {
  document.addEventListener('dragstart', handleDragStart)
  document.addEventListener('dragend', handleDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('dragstart', handleDragStart)
  document.removeEventListener('dragend', handleDragEnd)
})

// Update the drag over function for better event handling
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
    const snappedMinutes = Math.round(minutesInHour / TIME_INTERVAL) * TIME_INTERVAL

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
      const snappedMinutes = Math.round(minutes / TIME_INTERVAL) * TIME_INTERVAL

      dragOverHour.value = hourValue + snappedMinutes / 60
    } else {
      // Use noon as default if we can't determine position
      dragOverHour.value = 12
    }
  }

  // Show drag preview if we have an activity being dragged
  if (currentDraggedActivity.value) {
    // Get the activity duration
    const start = new Date(currentDraggedActivity.value.startTime)
    const end = new Date(currentDraggedActivity.value.endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    // Calculate preview position
    const hour = dragOverHour.value
    const startHour = Math.floor(hour)
    const startMinute = Math.round((hour % 1) * 60)

    // Calculate the position and height
    const startPosition = ((startHour - 6) * 60 + startMinute) / 60
    dragPreviewPosition.value = {
      top: startPosition * 60,
      height: durationHours * 60,
      day: date.toDateString(),
      visible: true,
    }
  }
}

const onDragLeave = event => {
  // Only reset if we're leaving to something that isn't a valid drop target
  const relatedTarget = event.relatedTarget
  if (!relatedTarget ||
    (!relatedTarget.classList.contains('time-slot') &&
      !relatedTarget.classList.contains('day-column') &&
      !relatedTarget.classList.contains('activity-block'))) {
    isDraggingOver.value = false
    dragOverDay.value = null
    dragOverHour.value = null

    // Hide the preview
    dragPreviewPosition.value.visible = false
  }
}

// Add mousedown handler to prepare for possible drag
const onActivityMouseDown = (event, activity) => {
  // Store the mouse position for potential drag operation
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  dragStartTime.value = new Date()

  // Store the activity that might be dragged
  isDraggingActivity.value = true
  currentDraggedActivity.value = activity

  // Let the event continue to propagate for normal drag operation
}

// Activity drag and drop handling
const onActivityDragStart = (event, activity) => {
  currentDraggedActivity.value = activity
  event.stopPropagation()
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    
    try {
      const stringData = JSON.stringify({
        type: 'activity',
        data: {
          id: activity.id,
          title: activity.title,
          startTime: activity.startTime.toISOString(),
          endTime: activity.endTime.toISOString(),
          description: activity.description || '',
          location: activity.location || '',
        },
        sourceId: activity.id,
      })
      
      event.dataTransfer.setData('text/plain', stringData)
      try {
        event.dataTransfer.setData('application/json', stringData)
      } catch (e) {
        // Fallback to text/plain only
      }
    } catch (e) {
      // Failed to set drag data
    }
    
    event.target.classList.add('dragging')
    
    try {
      const dragImage = event.target.cloneNode(true)
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      dragImage.style.opacity = '0.8'
      dragImage.style.transform = 'scale(0.8)'
      dragImage.style.width = event.target.offsetWidth + 'px'
      
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, 20)
      
      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 0)
    } catch (e) {
      // Error setting drag image
    }
  }
  
  isDragging.value = true
  document.body.classList.add('calendar-dragging-active')
  
  if (event.clientX && event.clientY) {
    dragStartPosition.value = { x: event.clientX, y: event.clientY }
  }
}

const onDragEnd = event => {
  // Stop propagation
  if (event) {
    event.stopPropagation()
  }

  // Remove visual feedback
  if (event && event.target) {
    event.target.classList.remove('dragging')
  }

  // Reset the drag state
  currentDraggedActivity.value = null
  isDraggingOver.value = false
  dragOverDay.value = null
  dragOverHour.value = null

  // Hide the preview
  dragPreviewPosition.value.visible = false

  // Remove global dragging state after a short delay
  // This prevents immediate re-grab issues
  setTimeout(() => {
    isDragging.value = false
    document.body.classList.remove('calendar-dragging-active')
  }, 50)
}

// Update the onDrop function to handle the data properly
const onDrop = (event, date, hour = null) => {
  event.preventDefault()
  event.stopPropagation()
  
  const dropHour = isDraggingOver.value ? dragOverHour.value : hour || 12
  
  isDraggingOver.value = false
  dragOverDay.value = null
  dragOverHour.value = null
  dragPreviewPosition.value.visible = false
  
  try {
    if (currentDraggedActivity.value) {
      const oldActivity = props.activities.find(a => a.id === currentDraggedActivity.value.id)
      
      if (oldActivity) {
        moveActivity(oldActivity, date, dropHour)
        isDragging.value = false
        document.body.classList.remove('calendar-dragging-active')
        return
      }
    }
    
    let jsonData
    
    try {
      jsonData = event.dataTransfer.getData('application/json')
    } catch (e) {
      try {
        jsonData = event.dataTransfer.getData('text/plain')
      } catch (e) {
        const types = event.dataTransfer.types
        for (let i = 0; i < types.length; i++) {
          const type = types[i]
          jsonData = event.dataTransfer.getData(type)
          if (jsonData) break
        }
      }
    }
    
    if (!jsonData) {
      isDragging.value = false
      document.body.classList.remove('calendar-dragging-active')
      return
    }
    
    const data = JSON.parse(jsonData)
    
    if (data.type === 'activity') {
      let activityData = data.data
      
      if (typeof activityData.startTime === 'string') {
        activityData.startTime = new Date(activityData.startTime)
        activityData.endTime = new Date(activityData.endTime)
      }
      
      const oldActivity = props.activities.find(a => a.id === activityData.id)
      
      if (oldActivity) {
        moveActivity(oldActivity, date, dropHour)
      } else {
        const dropDate = new Date(date)
        const hours = Math.floor(dropHour)
        const minutes = Math.round((dropHour % 1) * 60)
        dropDate.setHours(hours, minutes, 0, 0)
        
        let duration = 60 * 60 * 1000
        try {
          duration = activityData.endTime.getTime() - activityData.startTime.getTime()
        } catch (e) {}
        
        const endTime = new Date(dropDate.getTime() + duration)
        
        const newActivity = {
          id: `activity-${Date.now()}`,
          title: activityData.title,
          startTime: dropDate,
          endTime: endTime,
          description: activityData.description || '',
          location: activityData.location || '',
        }
        
        emit('update:activities', [...props.activities, newActivity])
      }
    } else if (data.type === 'place') {
      const dropDate = new Date(date)
      const hours = Math.floor(dropHour)
      const minutes = Math.round((dropHour % 1) * 60)
      dropDate.setHours(hours, minutes, 0, 0)
      
      const endTime = new Date(dropDate)
      endTime.setHours(endTime.getHours() + 1)
      
      const newActivity = {
        id: `activity-${Date.now()}`,
        title: data.data.name,
        startTime: dropDate,
        endTime: endTime,
        description: data.data.description,
        location: data.data.name,
      }
      
      emit('update:activities', [...props.activities, newActivity])
    }
  } catch (error) {
    // Error handling drop
  } finally {
    isDragging.value = false
    document.body.classList.remove('calendar-dragging-active')
    currentDraggedActivity.value = null
  }
}

// Helper function to move an activity to a new time
const moveActivity = (activity, date, hour) => {
  try {
    // Calculate duration of the activity
    const oldStart = new Date(activity.startTime)
    const oldEnd = new Date(activity.endTime)
    const durationMs = oldEnd.getTime() - oldStart.getTime()

    // Create new start time at drop location with precise hour
    const newStart = new Date(date)

    // Set hours with more precision (supporting decimal hours)
    const hours = Math.floor(hour)
    const minutes = Math.round((hour % 1) * 60)
    // Snap to TIME_INTERVAL
    const snappedMinutes = Math.round(minutes / TIME_INTERVAL) * TIME_INTERVAL
    newStart.setHours(hours, snappedMinutes, 0, 0)

    // Create new end time maintaining the same duration
    const newEnd = new Date(newStart.getTime() + durationMs)

    // Create updated activity
    const updatedActivity = {
      ...activity,
      startTime: newStart,
      endTime: newEnd,
    }

    // Update the activities array
    const updatedActivities = props.activities.map(a =>
      a.id === activity.id ? updatedActivity : a
    )

    // Emit the updated activities
    emit('update:activities', updatedActivities)
  } catch (error) {
    console.error('Error moving activity:', error)
  }
}

// Watch for changes in expanded state to refresh the view
watch(
  () => props.isExpanded,
  () => {
    // Recalculate the visible days when expanded state changes
    // This forces the calendar to refresh with the new number of days
    const newDate = new Date(currentDate.value)
    currentDate.value = newDate
  }
)

// Add resize event handlers
const startResize = (event, activity) => {
  isResizing.value = true
  resizingActivity.value = activity

  // Get the starting Y position
  if (event.type === 'touchstart') {
    resizeStartY.value = event.touches[0].clientY
  } else {
    resizeStartY.value = event.clientY
  }

  // Get the initial height of the activity
  const activityElement = event.currentTarget.parentElement
  initialActivityHeight.value = activityElement.offsetHeight

  // Add event listeners
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('touchmove', handleResize, { passive: false })
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchend', stopResize)

  // Prevent drag event from starting
  if (event.preventDefault) {
    event.preventDefault()
  }

  // Add resize class to the body
  document.body.classList.add('calendar-resizing')
}

const handleResize = event => {
  if (!isResizing.value || !resizingActivity.value) return

  // Get the current Y position
  const currentY = event.type === 'touchmove'
    ? event.touches[0].clientY
    : event.clientY

  // Calculate the height difference
  const yDiff = currentY - resizeStartY.value

  // Calculate new height (60px = 1 hour)
  let newHeight = initialActivityHeight.value + yDiff

  // Constrain to minimum height (15 minutes)
  newHeight = Math.max(newHeight, 15)

  // Snap to TIME_INTERVAL (e.g., 30 minute intervals)
  newHeight = Math.round(newHeight / ((TIME_INTERVAL * 60) / 60)) *
    ((TIME_INTERVAL * 60) / 60)

  // Calculate the new end time
  const startDate = new Date(resizingActivity.value.startTime)
  const newDurationHours = newHeight / 60

  // Create a new end date
  const newEndDate = new Date(startDate.getTime())
  newEndDate.setHours(
    startDate.getHours() + Math.floor(newDurationHours),
    startDate.getMinutes() + (newDurationHours % 1) * 60,
    0, 0
  )

  // Update the resizing activity (temporarily, we'll commit on mouseup)
  resizingActivity.value = {
    ...resizingActivity.value,
    endTime: newEndDate,
  }

  // Prevent default to avoid scroll behavior while resizing
  if (event.preventDefault) {
    event.preventDefault()
  }
}

const stopResize = () => {
  if (!isResizing.value || !resizingActivity.value) return

  // Get the original activity from props
  const activity = props.activities.find(
    a => a.id === resizingActivity.value.id
  )

  if (activity) {
    // Update the activity with the new end time
    const updatedActivities = props.activities.map(
      a => a.id === activity.id ? resizingActivity.value : a
    )

    // Emit the updated activities
    emit('update:activities', updatedActivities)
  }

  // Clean up
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('touchmove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchend', stopResize)

  // Reset state
  isResizing.value = false
  resizingActivity.value = null
  resizeStartY.value = 0
  initialActivityHeight.value = 0

  // Remove resize class from the body
  document.body.classList.remove('calendar-resizing')
}

// Add delete activity function in the script section
const deleteActivity = activity => {
  const updatedActivities = props.activities.filter(a => a.id !== activity.id)
  emit('update:activities', updatedActivities)
}
</script>

<style scoped>
.timeline-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  user-select: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.month-year {
  font-size: 1.25rem;
  font-weight: 500;
  color: #202124;
}

.nav-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #5f6368;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
}

.nav-button:hover {
  background-color: #f1f3f4;
  color: #1a73e8;
}

.prev-button {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.next-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.time-header-spacer {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  position: relative;
  height: 60px;
  display: flex;
  align-items: center;
}

.day-headers {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  height: 60px;
}

.day-header {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-right: 1px solid #e0e0e0;
  min-width: 0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.day-header:last-child {
  border-right: none;
}

.current-day {
  background-color: #e8f0fe;
  color: #1a73e8;
}

.day-name {
  font-size: 0.75rem;
  color: #5f6368;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-number {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1;
}

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

/* Styling for very small cells */
.activity-block[style*='height: 30px'] .activity-content h4,
.activity-block[style*='height: 20px'] .activity-content h4,
.activity-block[style*='height: 15px'] .activity-content h4 {
  font-size: 0.65rem;
  margin: 0;
  line-height: 1;
}

.activity-block[style*='height: 30px'] .activity-content p,
.activity-block[style*='height: 20px'] .activity-content p,
.activity-block[style*='height: 15px'] .activity-content p {
  display: none;
}

/* For medium-small cells */
.activity-block[style*='height: 45px'] .activity-content .location,
.activity-block[style*='height: 40px'] .activity-content .location,
.activity-block[style*='height: 35px'] .activity-content .location {
  display: none;
}

.activity-block[style*='height: 45px'] .activity-content h4,
.activity-block[style*='height: 40px'] .activity-content h4,
.activity-block[style*='height: 35px'] .activity-content h4 {
  font-size: 0.75rem;
  margin-bottom: 1px;
}

.activity-block[style*='height: 45px'] .activity-content p,
.activity-block[style*='height: 40px'] .activity-content p,
.activity-block[style*='height: 35px'] .activity-content p {
  font-size: 0.65rem;
  line-height: 1;
}

/* Adjust padding for activity blocks based on height */
.activity-block {
  padding: 4px;
}

.activity-block[style*='height: 30px'],
.activity-block[style*='height: 20px'],
.activity-block[style*='height: 15px'] {
  padding: 2px 2px 2px 2px;
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

  .activity-block[style*='height: 30px'] .activity-content h4,
  .activity-block[style*='height: 20px'] .activity-content h4,
  .activity-block[style*='height: 15px'] .activity-content h4 {
    font-size: 0.6rem;
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

  /* Hide location on small screens by default */
  .activity-content .location {
    display: none;
  }

  /* Only show location on taller blocks */
  .activity-block[style*='height: 60px'] .activity-content .location,
  .activity-block[style*='height: 70px'] .activity-content .location,
  .activity-block[style*='height: 80px'] .activity-content .location,
  .activity-block[style*='height: 90px'] .activity-content .location {
    display: block;
  }
}

/* Drag preview styling */
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

.expanded-view .day-header {
  padding: 10px 4px;
}

.expanded-columns .day-column {
  min-width: 90px;
}

@media (max-width: 768px) {
  .expanded-columns .day-column {
    min-width: 70px;
  }
}

/* Add a special class to handle the drag operation globally */
.calendar-dragging-active {
  cursor: grabbing !important;
}

/* Add visual feedback for the drop target */
.day-column.day-drag-over {
  background-color: rgba(66, 135, 245, 0.15);
  box-shadow: inset 0 0 0 2px #4287f5;
}

/* Resize handle styling */
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

/* Add a special class for resizing */
.calendar-resizing {
  cursor: ns-resize !important;
  user-select: none;
}

/* Add these styles in the style section */
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

/* Adjust activity content padding for better text spacing */
.activity-content {
  padding: 4px 6px 4px 6px;
}

/* Adjust small activity blocks */
.activity-block[style*='height: 30px'] .activity-content,
.activity-block[style*='height: 20px'] .activity-content,
.activity-block[style*='height: 15px'] .activity-content {
  padding: 2px 4px;
}

/* Hide delete button on very small blocks but keep the space */
.activity-block[style*='height: 20px'] .delete-button,
.activity-block[style*='height: 15px'] .delete-button {
  visibility: hidden;
  width: 10px;
  min-width: 10px;
}
</style>