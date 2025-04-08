<template>
  <div class="timeline-container">
    <div class="calendar-view">
      <!-- Date Range Picker -->
      <div class="calendar-header">
        <button class="nav-button" @click="previousWeek">&lt;</button>
        
        <div class="date-range-picker">
          <div class="date-range-display" @click="toggleDatePicker">
            <span>{{ formatDateRange }}</span>
          </div>
          
          <!-- Date Picker Popup -->
          <div v-if="isDatePickerOpen" class="date-picker-popup">
            <div class="date-picker-header">
              <button @click="prevMonth">&lt;</button>
              <span>{{ displayedMonthYear }}</span>
              <button @click="nextMonth">&gt;</button>
            </div>
            
            <div class="calendar-grid-picker">
              <!-- Day names -->
              <div class="weekday-headers">
                <div v-for="day in weekDays" :key="day" class="weekday-header">
                  {{ day }}
                </div>
              </div>
              
              <!-- Calendar days -->
              <div class="calendar-days">
                <div 
                  v-for="(day, index) in calendarDays" 
                  :key="index"
                  class="calendar-day"
                  :class="{
                    'outside-month': !day.isCurrentMonth,
                    'selected-start': isStartDate(day.date),
                    'selected-end': isEndDate(day.date),
                    'in-range': isInRange(day.date),
                    today: isToday(day.date),
                  }"
                  @click="selectDate(day.date)"
                >
                  {{ day.day }}
                </div>
              </div>
            </div>
            
            <div class="date-picker-actions">
              <button @click="cancelDateSelection" class="cancel-btn">
                Cancel
              </button>
              <button @click="applyDateSelection" class="apply-btn">
                Apply
              </button>
            </div>
          </div>
        </div>
        
        <button class="nav-button" @click="nextWeek">&gt;</button>
      </div>
      
      <!-- Calendar grid -->
      <div class="calendar-grid" :class="{ 'expanded-view': isExpanded }">
        <!-- Day headers -->
        <div class="day-headers">
          <div class="time-header-spacer"></div>
          <div
            v-for="day in visibleDays"
            :key="day.date"
            class="day-header"
            :class="{ 'current-day': isCurrentDay(day.date) }"
          >
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-number">{{ day.dayNumber }}</div>
          </div>
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
                'day-drag-over': isDraggingOver && 
                                dragOverDay === day.date.toDateString()
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
                    'drag-over': isDraggingOver && 
                               dragOverDay === day.date.toDateString() && 
                               Math.floor(dragOverHour) === hour
                  }"
                  @dragover.prevent="onDragOver($event, day.date, hour)" 
                  @drop.prevent="onDrop($event, day.date, hour)"
                  @dragleave="onDragLeave($event)"
                ></div>
              </div>
              
              <!-- Add drag preview overlay -->
              <div 
                v-if="dragPreviewPosition.visible && dragPreviewPosition.day === day.date.toDateString()"
                class="drag-preview"
                :style="{
                  top: dragPreviewPosition.top + 'px',
                  height: dragPreviewPosition.height + 'px'
                }"
              ></div>
              
              <!-- Activities for this day -->
              <div class="activities">
                <div
                  v-for="activity in getActivitiesForDay(day.date)"
                  :key="activity.id"
                  class="activity-block"
                  :style="getActivityStyle(activity)"
                  @click.stop="editActivity(activity)"
                  draggable="true"
                  @mousedown.stop="onActivityMouseDown($event, activity)"
                  @dragstart="onActivityDragStart($event, activity)"
                  @dragend="onDragEnd"
                >
                  <div class="activity-content">
                    <h4>{{ activity.title }}</h4>
                    <p class="time">
                      {{ formatTimeRange(activity.startTime, activity.endTime) }}
                    </p>
                    <p class="location">{{ activity.location }}</p>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  activities: {
    type: Array,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['update:activities'])

// Date picker state
const isDatePickerOpen = ref(false)
const displayDate = ref(new Date())
const startDate = ref(new Date())
const endDate = ref(null)
const tempStartDate = ref(null)
const tempEndDate = ref(null)
const currentDate = ref(new Date())

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

// Get visible days (based on selected date range or default view)
const visibleDays = computed(() => {
  const days = []
  
  // If a date range is selected, use it for calculation
  if (startDate.value && endDate.value) {
    // Calculate total days in the range
    const timeDiff = endDate.value.getTime() - startDate.value.getTime()
    const totalDaysInRange = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
    
    // Determine which segment of the range to display
    const segmentStart = new Date(currentDate.value)
    const maxSegments = Math.ceil(totalDaysInRange / DAYS_TO_SHOW.value)
    
    // Ensure we stay within the selected range
    if (segmentStart < startDate.value) {
      segmentStart.setTime(startDate.value.getTime())
    } else if (segmentStart > endDate.value) {
      segmentStart.setTime(endDate.value.getTime())
    }
    
    // Calculate how many days we can display (either DAYS_TO_SHOW or remaining days in range)
    const daysToEnd = Math.ceil((endDate.value.getTime() - segmentStart.getTime()) / (1000 * 3600 * 24)) + 1
    const daysCount = Math.min(daysToEnd, DAYS_TO_SHOW.value)
    
    // Create days within the range
    for (let i = 0; i < daysCount; i++) {
      const day = new Date(segmentStart)
      day.setDate(day.getDate() + i)
      
      // Don't go beyond end date
      if (day > endDate.value) break
      
      days.push({
        date: day,
        dayName: day.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNumber: day.getDate()
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
        dayNumber: day.getDate()
      })
    }
  }
  
  return days
})

// Date picker functions
const toggleDatePicker = () => {
  isDatePickerOpen.value = !isDatePickerOpen.value
  if (isDatePickerOpen.value) {
    tempStartDate.value = startDate.value
    tempEndDate.value = endDate.value
    displayDate.value = new Date(startDate.value)
  }
}

const prevMonth = () => {
  const newDate = new Date(displayDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  displayDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(displayDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  displayDate.value = newDate
}

const weekDays = computed(() => {
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
})

const calendarDays = computed(() => {
  const year = displayDate.value.getFullYear()
  const month = displayDate.value.getMonth()
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const lastDate = lastDay.getDate()
  
  // Previous month's days to show
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  
  const days = []
  
  // Add previous month's days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      day: prevMonthLastDay - i,
      date: date,
      isCurrentMonth: false
    })
  }
  
  // Add current month's days
  for (let i = 1; i <= lastDate; i++) {
    const date = new Date(year, month, i)
    days.push({
      day: i,
      date: date,
      isCurrentMonth: true
    })
  }
  
  // Add next month's days to complete the grid (6 rows of 7 days)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      day: i,
      date: date,
      isCurrentMonth: false
    })
  }
  
  return days
})

const selectDate = (date) => {
  if (!tempStartDate.value || (tempStartDate.value && tempEndDate.value)) {
    // Start new selection
    tempStartDate.value = new Date(date)
    tempEndDate.value = null
  } else {
    // Complete selection
    if (date < tempStartDate.value) {
      tempEndDate.value = tempStartDate.value
      tempStartDate.value = new Date(date)
    } else {
      tempEndDate.value = new Date(date)
    }
  }
}

const isStartDate = (date) => {
  return tempStartDate.value && 
    date.getDate() === tempStartDate.value.getDate() && 
    date.getMonth() === tempStartDate.value.getMonth() && 
    date.getFullYear() === tempStartDate.value.getFullYear()
}

const isEndDate = (date) => {
  return tempEndDate.value && 
    date.getDate() === tempEndDate.value.getDate() && 
    date.getMonth() === tempEndDate.value.getMonth() && 
    date.getFullYear() === tempEndDate.value.getFullYear()
}

const isInRange = (date) => {
  return tempStartDate.value && tempEndDate.value && 
    date > tempStartDate.value && date < tempEndDate.value
}

const isToday = (date) => {
  const today = new Date()
  return date.getDate() === today.getDate() && 
    date.getMonth() === today.getMonth() && 
    date.getFullYear() === today.getFullYear()
}

const applyDateSelection = () => {
  startDate.value = tempStartDate.value
  endDate.value = tempEndDate.value
  
  // Always reset current date to start date when applying a new date range
  if (startDate.value) {
    currentDate.value = new Date(startDate.value)
  }
  
  isDatePickerOpen.value = false
}

const cancelDateSelection = () => {
  tempStartDate.value = startDate.value
  tempEndDate.value = endDate.value
  isDatePickerOpen.value = false
}

// Format date range for display
const formatDateRange = computed(() => {
  if (!startDate.value) {
    return 'Select dates'
  }
  
  const start = startDate.value.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  })
  
  if (!endDate.value) {
    return start
  }
  
  const end = endDate.value.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  })
  
  return `${start} - ${end}`
})

// Format month and year for header
const displayedMonthYear = computed(() => {
  return displayDate.value.toLocaleDateString(undefined, { 
    month: 'long', 
    year: 'numeric' 
  })
})

// Check if a date is the current selected date
const isCurrentDay = date => {
  return date.toDateString() === currentDate.value.toDateString()
}

// Navigation functions
const previousWeek = () => {
  if (startDate.value && endDate.value) {
    // Calculate new current date by moving back DAYS_TO_SHOW days
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() - DAYS_TO_SHOW.value)
    
    // Don't navigate before start date
    if (newDate < startDate.value) {
      currentDate.value = new Date(startDate.value)
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
  if (startDate.value && endDate.value) {
    // Calculate new current date by moving forward DAYS_TO_SHOW days
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() + DAYS_TO_SHOW.value)
    
    // Don't navigate past end date
    const maxStartDate = new Date(endDate.value)
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
  // Instead of opening modal, we'll directly emit an event
  const updatedActivities = [...props.activities];
  console.log('Activity clicked:', activity);
  // You can implement alternative handling here
}

// Updated to handle activity update without modal
const handleActivitySubmit = activity => {
  if (activity.id) {
    // Update existing activity
    const updatedActivities = [...props.activities]
    const index = updatedActivities.findIndex(a => a.id === activity.id)
    if (index !== -1) {
      updatedActivities[index] = activity
    }
    emit('update:activities', updatedActivities)
  } else {
    // Add new activity
    emit('update:activities', [...props.activities, activity])
  }
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
const dragPreviewPosition = ref({ top: 0, height: 0, day: null, visible: false })

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
  // Always prevent default to allow the drop
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
    dragOverHour.value = hour + (snappedMinutes / 60)
  } else {
    // If dragged over day column but not a specific time slot, 
    // use either the current mouse position or a reasonable default
    if (event.clientY) {
      const columnRect = event.currentTarget.getBoundingClientRect()
      const relativeY = event.clientY - columnRect.top
      
      // Convert to hours (assuming 60px per hour)
      const hours = relativeY / 60
      const hourValue = Math.max(6, Math.min(22, Math.floor(hours) + 6))
      const minuteValue = Math.round((hours % 1) * 60 / TIME_INTERVAL) * TIME_INTERVAL / 60
      
      dragOverHour.value = hourValue + minuteValue
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
      visible: true
    }
  }
  
  console.log(`Drag over: ${date.toDateString()} at hour ${Math.floor(dragOverHour.value)}:${Math.round((dragOverHour.value % 1) * 60).toString().padStart(2, '0')}`)
}

const onDragLeave = (event) => {
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
  console.log('Activity drag start', activity)
  
  // Store reference to the dragged activity
  currentDraggedActivity.value = activity
  
  // This is critical for drag operations to work
  event.stopPropagation()
  
  // Set data transfer with the activity data
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
      
      // Set the data as plain text first (works in more browsers)
      event.dataTransfer.setData('text/plain', stringData)
      
      // Then try to set it as JSON (may not work in all browsers)
      try {
        event.dataTransfer.setData('application/json', stringData)
      } catch (e) {
        console.warn('Could not set application/json data, using text/plain only')
      }
    } catch (e) {
      console.error('Failed to set drag data:', e)
    }
    
    // Add visual feedback
    event.target.classList.add('dragging')
    
    // Set the drag image
    try {
      // Create a clone of the activity element for the drag image
      const dragImage = event.target.cloneNode(true)
      
      // Style the drag image
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      dragImage.style.opacity = '0.8'
      dragImage.style.transform = 'scale(0.8)'
      dragImage.style.width = event.target.offsetWidth + 'px'
      
      // Add to document
      document.body.appendChild(dragImage)
      
      // Set as drag image
      event.dataTransfer.setDragImage(
        dragImage, 
        dragImage.offsetWidth / 2, 
        20
      )
      
      // Clean up after drag image is captured
      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 0)
    } catch (e) {
      console.error('Error setting drag image:', e)
    }
  }
  
  // Set global dragging state
  isDragging.value = true
  document.body.classList.add('calendar-dragging-active')
  
  // Make sure we have the current position for preview calculations
  if (event.clientX && event.clientY) {
    dragStartPosition.value = { x: event.clientX, y: event.clientY }
  }
  
  console.log('Drag started successfully')
}

const onDragEnd = (event) => {
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
  // Always prevent default and stop propagation
  event.preventDefault()
  event.stopPropagation()
  
  console.log('Drop event triggered')
  
  // Use dragOverHour if available, otherwise use the provided hour
  const dropHour = isDraggingOver.value ? dragOverHour.value : (hour || 12)
  
  console.log(`Drop on: ${date.toDateString()} at hour ${Math.floor(dropHour)}:${Math.round((dropHour % 1) * 60).toString().padStart(2, '0')}`)
  
  // Reset drag over state
  isDraggingOver.value = false
  dragOverDay.value = null
  dragOverHour.value = null
  dragPreviewPosition.value.visible = false
  
  try {
    // Method 1: Try using the stored reference first (more reliable)
    if (currentDraggedActivity.value) {
      const oldActivity = props.activities.find(a => a.id === currentDraggedActivity.value.id)
      
      if (oldActivity) {
        console.log('Found activity to move (using reference):', oldActivity)
        moveActivity(oldActivity, date, dropHour)
        // Reset dragging state AFTER successful move
        isDragging.value = false
        document.body.classList.remove('calendar-dragging-active')
        return
      }
    }
    
    // Method 2: Fall back to dataTransfer if reference method failed
    let jsonData;
    
    // Try to get the data in different formats
    try {
      // First try application/json
      jsonData = event.dataTransfer.getData('application/json')
    } catch (e) {
      console.warn('Could not get application/json data:', e)
    }
    
    // If that fails, try text/plain
    if (!jsonData) {
      try {
        jsonData = event.dataTransfer.getData('text/plain')
      } catch (e) {
        console.warn('Could not get text/plain data:', e)
      }
    }
    
    // As a last resort, try getting all data
    if (!jsonData) {
      try {
        // Loop through all types and try to get data
        const types = event.dataTransfer.types
        for (let i = 0; i < types.length; i++) {
          const type = types[i]
          jsonData = event.dataTransfer.getData(type)
          if (jsonData) {
            console.log(`Got data from type: ${type}`)
            break
          }
        }
      } catch (e) {
        console.error('Error getting any drag data:', e)
      }
    }
    
    if (!jsonData) {
      console.log('No JSON data in drop event')
      // Reset the drag state anyway
      isDragging.value = false
      document.body.classList.remove('calendar-dragging-active')
      return
    }
    
    console.log('Dropped data:', jsonData)
    
    try {
      const data = JSON.parse(jsonData)
      
      if (data.type === 'activity') {
        // Handle existing activity being moved
        let activityData = data.data
        
        // Convert ISO strings back to Date objects if needed
        if (typeof activityData.startTime === 'string') {
          activityData.startTime = new Date(activityData.startTime)
          activityData.endTime = new Date(activityData.endTime)
        }
        
        const oldActivity = props.activities.find(a => a.id === activityData.id)
        
        if (oldActivity) {
          console.log('Found activity to move (using dataTransfer):', oldActivity)
          moveActivity(oldActivity, date, dropHour)
        } else {
          console.log('Could not find activity with ID:', activityData.id)
          // Create a new copy of the activity at the target location
          // This handles the case where the activity data exists but can't be found
          const dropDate = new Date(date)
          const hours = Math.floor(dropHour)
          const minutes = Math.round((dropHour % 1) * 60)
          dropDate.setHours(hours, minutes, 0, 0)
          
          // Calculate the duration from the data
          let duration = 60 * 60 * 1000 // Default 1 hour in ms
          try {
            duration = activityData.endTime.getTime() - activityData.startTime.getTime()
          } catch (e) {
            console.warn('Could not calculate duration, using default')
          }
          
          // Create end time
          const endTime = new Date(dropDate.getTime() + duration)
          
          // Create a new activity
          const newActivity = {
            id: `activity-${Date.now()}`,
            title: activityData.title,
            startTime: dropDate,
            endTime: endTime,
            description: activityData.description || '',
            location: activityData.location || '',
          }
          
          console.log('Created new activity from drag data:', newActivity)
          emit('update:activities', [...props.activities, newActivity])
        }
      } else if (data.type === 'place') {
        // Handle place drops (existing code)
        const dropDate = new Date(date)
        
        // Set hours with more precision
        const hours = Math.floor(dropHour)
        const minutes = Math.round((dropHour % 1) * 60)
        dropDate.setHours(hours, minutes, 0, 0)
        
        // Create end time (1 hour later)
        const endTime = new Date(dropDate)
        endTime.setHours(endTime.getHours() + 1)
        
        // Create a new activity from the place
        const newActivity = {
          id: `activity-${Date.now()}`,
          title: data.data.name,
          startTime: dropDate,
          endTime: endTime,
          description: data.data.description,
          location: data.data.name,
        }
        
        console.log('Created new activity from place:', newActivity)
        
        // Add to activities
        emit('update:activities', [...props.activities, newActivity])
      }
    } catch (error) {
      console.error('Error parsing JSON data:', error)
    }
  } catch (error) {
    console.error('Error handling drop:', error)
  } finally {
    // Always reset the dragging state
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
    newStart.setHours(hours, minutes, 0, 0)
    
    // Create new end time maintaining the same duration
    const newEnd = new Date(newStart.getTime() + durationMs)
    
    // Create updated activity
    const updatedActivity = {
      ...activity,
      startTime: newStart,
      endTime: newEnd,
    }
    
    console.log('Moving activity to:', updatedActivity)
    
    // Update the activities array
    const updatedActivities = props.activities.map(a => 
      a.id === activity.id ? updatedActivity : a
    )
    
    // Emit the updated activities
    emit('update:activities', updatedActivities)
    
    console.log('Activity moved successfully')
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

const handleResize = (event) => {
  if (!isResizing.value || !resizingActivity.value) return
  
  // Get the current Y position
  const currentY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY
  
  // Calculate the height difference
  const yDiff = currentY - resizeStartY.value
  
  // Calculate new height (60px = 1 hour)
  let newHeight = initialActivityHeight.value + yDiff
  
  // Constrain to minimum height (15 minutes)
  newHeight = Math.max(newHeight, 15)
  
  // Snap to TIME_INTERVAL (e.g., 30 minute intervals)
  newHeight = Math.round(newHeight / (TIME_INTERVAL * 60 / 60)) * (TIME_INTERVAL * 60 / 60)
  
  // Calculate the new end time
  const startDate = new Date(resizingActivity.value.startTime)
  const newDurationHours = newHeight / 60
  
  // Create a new end date
  const newEndDate = new Date(startDate.getTime())
  newEndDate.setHours(
    startDate.getHours() + Math.floor(newDurationHours),
    startDate.getMinutes() + ((newDurationHours % 1) * 60),
    0, 0
  )
  
  // Update the resizing activity (temporarily, we'll commit on mouseup)
  resizingActivity.value = {
    ...resizingActivity.value,
    endTime: newEndDate
  }
  
  // Prevent default to avoid scroll behavior while resizing
  if (event.preventDefault) {
    event.preventDefault()
  }
}

const stopResize = (event) => {
  if (!isResizing.value || !resizingActivity.value) return
  
  // Get the original activity from props
  const activity = props.activities.find(a => a.id === resizingActivity.value.id)
  
  if (activity) {
    // Update the activity with the new end time
    const updatedActivities = props.activities.map(a => 
      a.id === activity.id ? resizingActivity.value : a
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
  font-size: 1.5rem;
  color: #5f6368;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
}

.nav-button:hover {
  background-color: #f1f3f4;
}

/* Date Range Picker Styles */
.date-range-picker {
  position: relative;
  z-index: 10;
}

.date-range-display {
  cursor: pointer;
  background: #f8f9fa;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.9rem;
  color: #202124;
  display: inline-block;
  min-width: 200px;
  text-align: center;
}

.date-range-display:hover {
  background: #f1f3f4;
}

.date-picker-popup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 280px;
  z-index: 100;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.date-picker-header button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #5f6368;
  cursor: pointer;
  padding: 4px 8px;
}

.date-picker-header button:hover {
  background: #f1f3f4;
  border-radius: 50%;
}

.calendar-grid-picker {
  padding: 8px;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.weekday-header {
  font-size: 0.75rem;
  color: #5f6368;
  padding: 4px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  font-size: 0.875rem;
}

.calendar-day:hover {
  background-color: #f1f3f4;
}

.calendar-day.outside-month {
  color: #bdc1c6;
}

.calendar-day.today {
  font-weight: bold;
  color: #1a73e8;
}

.calendar-day.selected-start,
.calendar-day.selected-end {
  background-color: #1a73e8;
  color: white;
}

.calendar-day.in-range {
  background-color: #e8f0fe;
  border-radius: 0;
}

.calendar-day.in-range:first-child {
  border-top-left-radius: 50%;
  border-bottom-left-radius: 50%;
}

.calendar-day.in-range:last-child {
  border-top-right-radius: 50%;
  border-bottom-right-radius: 50%;
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px;
  border-top: 1px solid #e0e0e0;
}

.date-picker-actions button {
  border: none;
  background: none;
  padding: 8px 12px;
  margin-left: 8px;
  cursor: pointer;
  border-radius: 4px;
}

.cancel-btn {
  color: #5f6368;
}

.cancel-btn:hover {
  background-color: #f1f3f4;
}

.apply-btn {
  color: white;
  background-color: #1a73e8 !important;
}

.apply-btn:hover {
  background-color: #1967d2 !important;
}

/* Original Styles */
.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.day-headers {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.time-header-spacer {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
}

.day-header {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  border-right: 1px solid #e0e0e0;
  min-width: 0;
  transition: all 0.3s ease;
}

.day-header:last-child {
  border-right: none;
}

.current-day {
  background-color: #e8f0fe;
  color: #1a73e8;
}

.day-name {
  font-size: 0.875rem;
  color: #5f6368;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-number {
  font-size: 1.5rem;
  font-weight: 500;
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
  padding: 8px;
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
}

.activity-content h4 {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-content p {
  margin: 0;
  font-size: 0.75rem;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-content .time {
  margin-bottom: 2px;
}

.activity-content .location {
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  color: #5f6368;
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

.activity-block {
  position: absolute;
  left: 4px;
  right: 4px;
  background-color: #e8f0fe;
  border-left: 4px solid #1a73e8;
  border-radius: 4px;
  padding: 8px;
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

/* More visible drag-over states */
.day-column.day-drag-over {
  background-color: rgba(66, 135, 245, 0.15);
  box-shadow: inset 0 0 0 2px #4287f5;
}

.time-slot.drag-over {
  background-color: rgba(66, 135, 245, 0.4);
  border: 2px dashed #4287f5;
  box-shadow: inset 0 0 5px rgba(66, 135, 245, 0.5);
  z-index: 2;
}

/* Add a special class for the dragging state */
.calendar-dragging-active {
  cursor: grabbing !important;
}

.calendar-dragging-active * {
  cursor: grabbing !important;
}
</style> 