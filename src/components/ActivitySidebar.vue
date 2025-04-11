<template>
  <div
    class="activity-sidebar w-96 bg-white rounded-lg shadow-lg ml-4 p-4 flex flex-col"
  >
    <div class="search-container mb-6">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search"
        class="w-full p-3 bg-gray-100 rounded-md"
        @input="searchActivities"
      />
    </div>
    <h3 class="text-lg font-medium mb-4">Popular places</h3>
    <div class="popular-places flex-1 overflow-y-auto">
      <div
        v-for="place in popularPlaces"
        :key="place.id"
        class="place-card bg-gray-100 rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-200 transition-colors"
        @click="handlePlaceClick(place)"
        draggable="true"
        @dragstart="onDragStart($event, place)"
      >
        <h4 class="font-medium mb-2">{{ place.name }}</h4>
        <p class="text-sm text-gray-600">{{ place.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Define props
defineProps({
  places: {
    type: Array,
    default: () => [],
  },
})

// Define emits
const emit = defineEmits(['place-selected', 'search', 'place-drag'])

// Local state
const searchQuery = ref('')
const popularPlaces = ref([
  {
    id: 1,
    name: 'Empire State Building',
    description: 'Iconic 102-story skyscraper in Midtown Manhattan',
  },
  {
    id: 2,
    name: 'Central Park',
    description: 'Urban park in Manhattan, New York City',
  },
  {
    id: 3,
    name: 'Times Square',
    description:
      'Major commercial intersection, tourist destination, entertainment center',
  },
  {
    id: 4,
    name: 'Statue of Liberty',
    description: 'Colossal neoclassical sculpture on Liberty Island',
  },
  {
    id: 5,
    name: 'Brooklyn Bridge',
    description:
      'Historic hybrid cable-stayed/suspension bridge in New York City',
  },
])

// Handle search input
const searchActivities = () => {
  emit('search', searchQuery.value)
}

// Handle place selection
const handlePlaceClick = place => {
  emit('place-selected', place)
}

// Handle drag start
const onDragStart = (event, place) => {
  // Set the data to be transferred
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'place',
      data: place,
    })
  )
  // Add a class to the element being dragged
  event.target.classList.add('dragging')
  // Emit an event that a place is being dragged
  emit('place-drag', place)
}
</script>

<style scoped>
.activity-sidebar {
  height: calc(100vh - 120px);
}

.popular-places {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.popular-places::-webkit-scrollbar {
  width: 6px;
}

.popular-places::-webkit-scrollbar-track {
  background: #f7fafc;
}

.popular-places::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

.place-card.dragging {
  opacity: 0.5;
}
</style>
