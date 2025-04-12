<template>
  <div class="min-h-screen bg-gray-100">
    <div
      class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
      :class="{ 'px-2': isCalendarExpanded }"
    >
      <div
        class="flex"
        :class="{ 'flex-col': isCalendarExpanded && !isSidebarVisible }"
      >
        <div
          class="flex-1 bg-white shadow rounded-lg"
          :class="{ 'transition-all duration-300': true }"
        >
          <div class="px-4 py-5 sm:p-6">
            <div class="flex justify-between items-center mb-6">
              <div class="flex items-center space-x-4">
                <h2 class="text-3xl font-bold text-gray-900">New York</h2>
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
                        <div
                          v-for="day in weekDays"
                          :key="day"
                          class="weekday-header"
                        >
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
                      <button class="cancel-btn" @click="cancelDateSelection">
                        Cancel
                      </button>
                      <button class="apply-btn" @click="applyDateSelection">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  v-if="isCalendarExpanded"
                  @click="toggleSidebar"
                  class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  title="Toggle Sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </button>
                <button
                  class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  :title="isCalendarExpanded ? 'Collapse View' : 'Expand View'"
                  @click="toggleCalendarExpand"
                >
                  <svg
                    v-if="isCalendarExpanded"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 9l6 6m0-6l-6 6"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="border-t border-gray-200 pt-4">
              <div
                :class="{
                  'h-[600px]': !isCalendarExpanded,
                  'h-[calc(100vh-200px)]': isCalendarExpanded,
                  'transition-all duration-300': true,
                }"
              >
                <TimelineView
                  :activities="activities"
                  :is-expanded="isCalendarExpanded"
                  :start-date="startDate"
                  :end-date="endDate"
                  @update:activities="updateActivities"
                />
              </div>
            </div>
          </div>
        </div>
        <!-- Activity Sidebar -->
        <transition name="slide">
          <ActivitySidebar
            v-if="shouldShowSidebar"
            @place-selected="handlePlaceSelected"
            @search="handleSearch"
            @place-drag="handlePlaceDrag"
            class="transition-all duration-300"
            :class="{
              'sidebar-expanded': isCalendarExpanded && isSidebarVisible,
            }"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TimelineView from '@/components/TimelineView/TimelineView.vue'
import ActivitySidebar from '@/components/ActivitySidebar.vue'

const isCalendarExpanded = ref(false)
const isSidebarVisible = ref(false)
const isDatePickerOpen = ref(false)
const displayDate = ref(new Date())
const startDate = ref(new Date())
const endDate = ref(null)
const tempStartDate = ref(null)
const tempEndDate = ref(null)
const activities = ref([
  {
    id: '1',
    title: "Breakfast at Tiffany's Cafe",
    startTime: new Date('2025-04-06T08:00:00'),
    endTime: new Date('2025-04-06T09:00:00'),
    description: 'Start the day with a delicious breakfast',
    location: "Tiffany's Cafe, Downtown",
  },
  {
    id: '2',
    title: 'Empire State Building Visit',
    startTime: new Date('2025-04-06T10:30:00'),
    endTime: new Date('2025-04-06T12:30:00'),
    description: 'Visit the iconic landmark and enjoy the views',
    location: 'Empire State Building, 5th Ave',
  },
  {
    id: '3',
    title: 'Lunch at Central Park',
    startTime: new Date('2025-04-06T13:00:00'),
    endTime: new Date('2025-04-06T14:30:00'),
    description: 'Relaxing picnic lunch in the park',
    location: 'Central Park, The Great Lawn',
  },
  {
    id: '4',
    title: 'Museum of Modern Art',
    startTime: new Date('2025-04-07T10:00:00'),
    endTime: new Date('2025-04-07T13:00:00'),
    description: 'Explore contemporary art exhibits',
    location: 'MoMA, 11 W 53rd St',
  },
  {
    id: '5',
    title: 'Broadway Show - Hamilton',
    startTime: new Date('2025-04-07T19:00:00'),
    endTime: new Date('2025-04-07T22:00:00'),
    description: 'Evening entertainment at Broadway',
    location: 'Richard Rodgers Theatre, 226 W 46th St',
  },
  {
    id: '6',
    title: 'Statue of Liberty Tour',
    startTime: new Date('2025-04-08T09:00:00'),
    endTime: new Date('2025-04-08T12:00:00'),
    description: 'Boat tour to Liberty Island',
    location: 'Battery Park Ferry Terminal',
  },
  {
    id: '7',
    title: 'Shopping at 5th Avenue',
    startTime: new Date('2025-04-08T14:00:00'),
    endTime: new Date('2025-04-08T17:00:00'),
    description: 'Luxury shopping experience',
    location: '5th Avenue, Midtown Manhattan',
  },
])

const toggleCalendarExpand = () => {
  isCalendarExpanded.value = !isCalendarExpanded.value
  // When expanding the calendar, hide the sidebar initially
  if (isCalendarExpanded.value) {
    isSidebarVisible.value = false
  } else {
    // When collapsing, always show the sidebar in normal view
    isSidebarVisible.value = false
  }
}

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}

const updateActivities = newActivities => {
  console.log('Activities updated:', newActivities)
  activities.value = [...newActivities]
}

const handlePlaceSelected = place => {
  console.log('Place selected:', place)
  // Here you can handle the selected place without the modal
}

const handleSearch = query => {
  console.log('Searching for:', query)
  // Here you would typically filter activities or search for places
}

const handlePlaceDrag = place => {
  console.log('Place being dragged:', place)
  // You can add any additional handling here if needed
}

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
      isCurrentMonth: false,
    })
  }
  // Add current month's days
  for (let i = 1; i <= lastDate; i++) {
    const date = new Date(year, month, i)
    days.push({
      day: i,
      date: date,
      isCurrentMonth: true,
    })
  }
  // Add next month's days to complete the grid (6 rows of 7 days)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      day: i,
      date: date,
      isCurrentMonth: false,
    })
  }
  return days
})

const selectDate = date => {
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

const isStartDate = date =>
  tempStartDate.value &&
  date.getDate() === tempStartDate.value.getDate() &&
  date.getMonth() === tempStartDate.value.getMonth() &&
  date.getFullYear() === tempStartDate.value.getFullYear()

const isEndDate = date =>
  tempEndDate.value &&
  date.getDate() === tempEndDate.value.getDate() &&
  date.getMonth() === tempEndDate.value.getMonth() &&
  date.getFullYear() === tempEndDate.value.getFullYear()

const isInRange = date =>
  tempStartDate.value &&
  tempEndDate.value &&
  date > tempStartDate.value &&
  date < tempEndDate.value

const isToday = date => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const applyDateSelection = () => {
  startDate.value = tempStartDate.value
  endDate.value = tempEndDate.value
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
    year: 'numeric',
  })
  if (!endDate.value) {
    return start
  }
  const end = endDate.value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${start} - ${end}`
})

// Format month and year for header
const displayedMonthYear = computed(() => {
  return displayDate.value.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
})

const shouldShowSidebar = computed(
  () =>
    !isCalendarExpanded.value ||
    (isCalendarExpanded.value && isSidebarVisible.value)
)
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

.sidebar-expanded {
  position: absolute;
  right: 20px;
  top: 120px;
  height: calc(100vh - 140px);
  z-index: 10;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.date-range-picker {
  position: relative;
  display: inline-block;
}

.date-range-display {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.date-range-display:hover {
  border-color: #9ca3af;
}

.date-picker-popup {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  min-width: 300px;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.date-picker-header button {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background-color: white;
  cursor: pointer;
}

.date-picker-header button:hover {
  background-color: #f3f4f6;
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.apply-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: white;
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.cancel-btn:hover {
  background-color: #f3f4f6;
}

.apply-btn {
  background-color: #3b82f6;
  border: 1px solid #3b82f6;
  color: white;
}

.apply-btn:hover {
  background-color: #2563eb;
}

.calendar-grid-picker {
  padding: 0.75rem;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday-header {
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.calendar-day:hover {
  background-color: #f3f4f6;
}

.calendar-day.outside-month {
  color: #9ca3af;
}

.calendar-day.today {
  background-color: #e5e7eb;
  font-weight: 500;
}

.calendar-day.selected-start,
.calendar-day.selected-end {
  background-color: #3b82f6;
  color: white;
}

.calendar-day.in-range {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>
