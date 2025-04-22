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
                <div class="relative">
                  <input
                    type="text"
                    v-model="destination"
                    placeholder="Where to?"
                    class="w-64 px-4 py-2 text-xl font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    @focus="showSearchResults = true"
                    @input="handleSearchInput"
                    aria-label="Search destination"
                  />
                  <div
                    v-if="destination"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <button
                      @click="clearDestination"
                      class="text-gray-600 hover:text-gray-800"
                      aria-label="Clear destination search"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <!-- Search Results Dropdown -->
                  <div
                    v-if="
                      showSearchResults &&
                      (filteredDestinations.length > 0 ||
                        recentSearches.length > 0)
                    "
                    class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                  >
                    <!-- Recent Searches -->
                    <div
                      v-if="recentSearches.length > 0"
                      class="border-b border-gray-200"
                    >
                      <div class="px-3 py-2 text-xs font-medium text-gray-500">
                        Recent Searches
                      </div>
                      <div
                        v-for="search in recentSearches"
                        :key="search"
                        class="p-3 hover:bg-gray-100 cursor-pointer"
                        @click="selectRecentSearch(search)"
                      >
                        <div class="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span class="text-gray-900">{{ search }}</span>
                        </div>
                      </div>
                    </div>
                    <!-- Destination Results -->
                    <div
                      v-for="dest in filteredDestinations"
                      :key="dest.id"
                      class="p-3 hover:bg-gray-100 cursor-pointer flex items-center space-x-3"
                      @click="selectDestination(dest)"
                    >
                      <img
                        :src="dest.image"
                        :alt="dest.name"
                        class="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ dest.name }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ dest.country }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="date-range-picker">
                  <div class="date-range-display" @click="toggleDatePicker">
                    <span class="px-4 py-2 text-base text-gray-900">
                      {{ formatDateRange }}
                    </span>
                  </div>
                  <!-- Date Picker Popup -->
                  <div v-if="isDatePickerOpen" class="date-picker-popup">
                    <div class="date-picker-header">
                      <button @click="prevMonth" aria-label="Previous month">
                        &lt;
                      </button>
                      <span>{{ displayedMonthYear }}</span>
                      <button @click="nextMonth" aria-label="Next month">
                        &gt;
                      </button>
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
                      <button
                        class="cancel-btn"
                        @click="cancelDateSelection"
                        aria-label="Cancel date selection"
                      >
                        Cancel
                      </button>
                      <button
                        class="apply-btn"
                        @click="applyDateSelection"
                        aria-label="Apply date selection"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Toolbar -->
              <div
                class="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1"
              >
                <button
                  class="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :title="isCalendarExpanded ? 'Collapse View' : 'Expand View'"
                  @click="toggleCalendarExpand"
                  :aria-label="
                    isCalendarExpanded ? 'Collapse View' : 'Expand View'
                  "
                >
                  <svg
                    v-if="isCalendarExpanded"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-600"
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
                    class="h-5 w-5 text-gray-600"
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
                <button
                  class="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Export to Calendar"
                  @click="exportToCalendar"
                  aria-label="Export itinerary to calendar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
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
            class="transition-all duration-300"
            :class="{
              'sidebar-expanded': isCalendarExpanded && isSidebarVisible,
            }"
            @place-selected="handlePlaceSelected"
            @search="handleSearch"
            @place-drag="handlePlaceDrag"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TimelineView from '@/components/TimelineView/TimelineView.vue'
import ActivitySidebar from '@/components/ActivitySidebar.vue'
import { generateICalendar, downloadICalendar } from '@/utils/calendarExport'

const destination = ref('')
const isCalendarExpanded = ref(false)
const isSidebarVisible = ref(false)
const isDatePickerOpen = ref(false)
const showSearchResults = ref(false)
const displayDate = ref(new Date())
const startDate = ref(new Date())
const endDate = ref(null)
const tempStartDate = ref(null)
const tempEndDate = ref(null)
const recentSearches = ref([])
const MAX_RECENT_SEARCHES = 5
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

// Mock destinations data
const mockDestinations = [
  {
    id: 1,
    name: 'New York',
    country: 'USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
  },
  {
    id: 2,
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
  },
  {
    id: 3,
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989',
  },
  {
    id: 4,
    name: 'London',
    country: 'UK',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
  },
  {
    id: 5,
    name: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
  },
  {
    id: 6,
    name: 'Barcelona',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1583422409516-289eea28e2f1',
  },
  {
    id: 7,
    name: 'Dubai',
    country: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
  },
  {
    id: 8,
    name: 'Sydney',
    country: 'Australia',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9',
  },
  {
    id: 9,
    name: 'Rio de Janeiro',
    country: 'Brazil',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325',
  },
  {
    id: 10,
    name: 'Cape Town',
    country: 'South Africa',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5',
  },
]

// Computed property for filtered destinations
const filteredDestinations = computed(() => {
  if (!destination.value) return []
  const searchTerm = destination.value.toLowerCase()
  return mockDestinations.filter(
    dest =>
      dest.name.toLowerCase().includes(searchTerm) ||
      dest.country.toLowerCase().includes(searchTerm)
  )
})

// Load recent searches from localStorage on component mount
onMounted(() => {
  const savedSearches = localStorage.getItem('recentSearches')
  if (savedSearches) {
    recentSearches.value = JSON.parse(savedSearches)
  }
})

// Save recent searches to localStorage
const saveRecentSearches = () => {
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
}

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

const clearDestination = () => {
  destination.value = ''
  showSearchResults.value = false
}

const selectDestination = dest => {
  destination.value = dest.name
  showSearchResults.value = false

  // Add to recent searches if not already present
  if (!recentSearches.value.includes(dest.name)) {
    recentSearches.value.unshift(dest.name)
    // Keep only the most recent searches
    if (recentSearches.value.length > MAX_RECENT_SEARCHES) {
      recentSearches.value.pop()
    }
    saveRecentSearches()
  }
}

const exportToCalendar = () => {
  const calendarContent = generateICalendar(activities.value)
  downloadICalendar(calendarContent)
}

const handleSearchInput = () => {
  showSearchResults.value = true
}

const selectRecentSearch = search => {
  destination.value = search
  showSearchResults.value = false
}
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
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  color: #1f2937;
  font-size: 1rem;
  display: flex;
  align-items: center;
  width: fit-content;
}

.date-range-display:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
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
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.date-picker-header button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  cursor: pointer;
  color: #1f2937;
  font-weight: 500;
}

.date-picker-header button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.cancel-btn,
.apply-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
}

.cancel-btn:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.apply-btn {
  background-color: #2563eb;
  border: 1px solid #2563eb;
  color: white;
}

.apply-btn:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

.calendar-grid-picker {
  padding: 1rem;
  background-color: white;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday-header {
  text-align: center;
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 600;
  padding: 0.5rem 0;
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
  height: 2.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  color: #1f2937;
}

.calendar-day:hover {
  background-color: #f3f4f6;
}

.calendar-day.outside-month {
  color: #6b7280;
}

.calendar-day.today {
  background-color: #e5e7eb;
  font-weight: 600;
  color: #1f2937;
}

.calendar-day.selected-start,
.calendar-day.selected-end {
  background-color: #2563eb;
  color: #ffffff;
}

.calendar-day.in-range {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>
