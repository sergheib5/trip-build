import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function useTimelineView(props, emit) {
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

  // Generate hours from 1am to 11pm
  const hours = computed(() => {
    const hours = []
    for (let i = 1; i <= 23; i++) {
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
      const segmentStart = new Date(currentDate.value)

      // Ensure we stay within the selected range
      if (segmentStart < props.startDate) {
        segmentStart.setTime(props.startDate.getTime())
      } else if (segmentStart > props.endDate) {
        segmentStart.setTime(props.endDate.getTime())
      }

      // Calculate how many days we can display
      const daysToEnd =
        Math.ceil(
          (props.endDate.getTime() - segmentStart.getTime()) /
            (1000 * 3600 * 24)
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

    // Calculate position from 1am (0) to 11pm (22 hours)
    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const endHour = end.getHours()
    const endMinute = end.getMinutes()

    const startPosition = ((startHour - 1) * 60 + startMinute) / 60
    const duration =
      ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60

    return {
      top: `${startPosition * 60}px`,
      height: `${duration * 60}px`,
      // Add visual indication if this activity is being resized
      border:
        isResizing.value && resizingActivity.value?.id === activity.id
          ? '2px solid #1a73e8'
          : undefined,
    }
  }

  // Handle activity click
  const editActivity = () => {
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
      const snappedMinutes =
        Math.round(minutesInHour / TIME_INTERVAL) * TIME_INTERVAL

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
        const hourValue = Math.max(1, Math.min(23, Math.floor(hours) + 1))
        const minutes = Math.round((hours % 1) * 60)
        const snappedMinutes =
          Math.round(minutes / TIME_INTERVAL) * TIME_INTERVAL

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
      const startPosition = ((startHour - 1) * 60 + startMinute) / 60
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
        event.dataTransfer.setDragImage(
          dragImage,
          dragImage.offsetWidth / 2,
          20
        )

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
        const oldActivity = props.activities.find(
          a => a.id === currentDraggedActivity.value.id
        )

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
            duration =
              activityData.endTime.getTime() - activityData.startTime.getTime()
          } catch (e) {
            // Empty block statement
          }

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
    const currentY =
      event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

    // Calculate the height difference
    const yDiff = currentY - resizeStartY.value

    // Calculate new height (60px = 1 hour)
    let newHeight = initialActivityHeight.value + yDiff

    // Constrain to minimum height (15 minutes)
    newHeight = Math.max(newHeight, 15)

    // Snap to TIME_INTERVAL (e.g., 30 minute intervals)
    newHeight =
      Math.round(newHeight / ((TIME_INTERVAL * 60) / 60)) *
      ((TIME_INTERVAL * 60) / 60)

    // Calculate the new end time
    const startDate = new Date(resizingActivity.value.startTime)
    const newDurationHours = newHeight / 60

    // Create a new end date
    const newEndDate = new Date(startDate.getTime())
    newEndDate.setHours(
      startDate.getHours() + Math.floor(newDurationHours),
      startDate.getMinutes() + (newDurationHours % 1) * 60,
      0,
      0
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

  // Add delete activity function
  const deleteActivity = activity => {
    const updatedActivities = props.activities.filter(a => a.id !== activity.id)
    emit('update:activities', updatedActivities)
  }

  return {
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
  }
}
