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
              v-if="storeAuth.user.id"
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

        <!-- User Authentication Section -->
        <div class="flex items-center space-x-4">
          <template v-if="storeAuth.user.id">
            <span class="text-gray-300 text-sm">
              {{ storeAuth.user.email }}
            </span>
            <button
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              @click="handleLogout"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <router-link
              to="/auth"
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Login / Register
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useStoreAuth } from '@/stores/storeAuth'

const storeAuth = useStoreAuth()

const handleLogout = () => {
  storeAuth.logoutUser()
}
</script>
