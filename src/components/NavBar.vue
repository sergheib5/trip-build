<template>
  <nav class="bg-gray-800 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="text-xl font-bold">TripBuilder</span>
          </div>
          <div class="ml-10 flex items-baseline space-x-4">
            <router-link
              to="/"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="[
                $route.path === '/'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
              ]"
            >
              Home
            </router-link>
            <router-link
              to="/itinerary"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="[
                $route.path === '/itinerary'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
              ]"
            >
              Itinerary
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
// No additional imports needed
</script>
