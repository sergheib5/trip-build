<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8" :class="{ 'px-2': isCalendarExpanded }">
      <div class="flex" :class="{ 'flex-col': isCalendarExpanded && !isSidebarVisible }">
        <div class="flex-1 bg-white shadow rounded-lg" :class="{ 'transition-all duration-300': true }">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-3xl font-bold text-gray-900">
                Your Itinerary
              </h2>
              <div class="flex items-center space-x-2">
                <button 
                  v-if="isCalendarExpanded"
                  @click="toggleSidebar" 
                  class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  title="Toggle Sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                <button 
                  @click="toggleCalendarExpand" 
                  class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  :title="isCalendarExpanded ? 'Collapse View' : 'Expand View'"
                >
                  <svg v-if="isCalendarExpanded" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="border-t border-gray-200 pt-4">
              <div :class="{ 
                'h-[600px]': !isCalendarExpanded, 
                'h-[calc(100vh-200px)]': isCalendarExpanded, 
                'transition-all duration-300': true 
              }">
                <TimelineView
                  :activities="activities"
                  @update:activities="updateActivities"
                  :isExpanded="isCalendarExpanded"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Activity Sidebar -->
        <transition name="slide">
          <ActivitySidebar
            v-if="!isCalendarExpanded || (isCalendarExpanded && isSidebarVisible)"
            @place-selected="handlePlaceSelected"
            @search="handleSearch"
            @place-drag="handlePlaceDrag"
            class="transition-all duration-300"
            :class="{ 'sidebar-expanded': isCalendarExpanded && isSidebarVisible }"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TimelineView from '@/components/TimelineView.vue'
import ActivitySidebar from '@/components/ActivitySidebar.vue'

const isCalendarExpanded = ref(false)
const isSidebarVisible = ref(false)
const activities = ref([
  {
    id: '1',
    title: 'Breakfast at Tiffany\'s Cafe',
    startTime: new Date('2025-04-06T08:00:00'),
    endTime: new Date('2025-04-06T09:00:00'),
    description: 'Start the day with a delicious breakfast',
    location: 'Tiffany\'s Cafe, Downtown'
  },
  {
    id: '2',
    title: 'Empire State Building Visit',
    startTime: new Date('2025-04-06T10:30:00'),
    endTime: new Date('2025-04-06T12:30:00'),
    description: 'Visit the iconic landmark and enjoy the views',
    location: 'Empire State Building, 5th Ave'
  },
  {
    id: '3',
    title: 'Lunch at Central Park',
    startTime: new Date('2025-04-06T13:00:00'),
    endTime: new Date('2025-04-06T14:30:00'),
    description: 'Relaxing picnic lunch in the park',
    location: 'Central Park, The Great Lawn'
  },
  {
    id: '4',
    title: 'Museum of Modern Art',
    startTime: new Date('2025-04-07T10:00:00'),
    endTime: new Date('2025-04-07T13:00:00'),
    description: 'Explore contemporary art exhibits',
    location: 'MoMA, 11 W 53rd St'
  },
  {
    id: '5',
    title: 'Broadway Show - Hamilton',
    startTime: new Date('2025-04-07T19:00:00'),
    endTime: new Date('2025-04-07T22:00:00'),
    description: 'Evening entertainment at Broadway',
    location: 'Richard Rodgers Theatre, 226 W 46th St'
  },
  {
    id: '6',
    title: 'Statue of Liberty Tour',
    startTime: new Date('2025-04-08T09:00:00'),
    endTime: new Date('2025-04-08T12:00:00'),
    description: 'Boat tour to Liberty Island',
    location: 'Battery Park Ferry Terminal'
  },
  {
    id: '7',
    title: 'Shopping at 5th Avenue',
    startTime: new Date('2025-04-08T14:00:00'),
    endTime: new Date('2025-04-08T17:00:00'),
    description: 'Luxury shopping experience',
    location: '5th Avenue, Midtown Manhattan'
  }
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

const updateActivities = (newActivities) => {
  console.log('Activities updated:', newActivities)
  activities.value = [...newActivities]
}

const handlePlaceSelected = (place) => {
  console.log('Place selected:', place)
  // Here you can handle the selected place without the modal
}

const handleSearch = (query) => {
  console.log('Searching for:', query)
  // Here you would typically filter activities or search for places
}

const handlePlaceDrag = (place) => {
  console.log('Place being dragged:', place)
  // You can add any additional handling here if needed
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style> 