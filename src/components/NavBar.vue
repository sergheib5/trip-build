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

        <!-- User Profile Section -->
        <div class="flex items-center space-x-4">
          <template v-if="storeAuth.user.id">
            <div class="relative" @click.stop>
              <button
                class="flex items-center space-x-2 focus:outline-none"
                @click="toggleProfileMenu"
              >
                <div class="relative">
                  <div
                    class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium"
                  >
                    {{ getUserInitials }}
                  </div>
                  <div
                    v-if="hasNotifications"
                    class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  ></div>
                </div>
                <svg
                  class="w-4 h-4 text-gray-300"
                  :class="{ 'transform rotate-180': isProfileMenuOpen }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- Profile Dropdown Menu -->
              <div
                v-if="isProfileMenuOpen"
                class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              >
                <div
                  class="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <router-link
                    to="/profile"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="closeProfileMenu"
                  >
                    My Profile
                  </router-link>
                  <router-link
                    to="/settings"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="closeProfileMenu"
                  >
                    Settings
                  </router-link>
                  <router-link
                    to="/saved-trips"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="closeProfileMenu"
                  >
                    Saved Trips
                  </router-link>
                  <router-link
                    to="/payment-methods"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="closeProfileMenu"
                  >
                    Payment Methods
                  </router-link>
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="closeProfileMenu"
                  >
                    Help
                  </a>
                  <button
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="handleLogout"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
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
import { ref, computed } from 'vue'
import { useStoreAuth } from '@/stores/storeAuth'

const storeAuth = useStoreAuth()
const isProfileMenuOpen = ref(false)
const hasNotifications = ref(true) // This should be connected to your notification system

const getUserInitials = computed(() => {
  if (!storeAuth.user.name) return '?'
  return storeAuth.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const toggleProfileMenu = () => {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

const closeProfileMenu = () => {
  isProfileMenuOpen.value = false
}

const handleLogout = () => {
  storeAuth.logoutUser()
  closeProfileMenu()
}

// Close menu when clicking outside
document.addEventListener('click', () => {
  isProfileMenuOpen.value = false
})
</script>

<style scoped>
/* Add any additional styles here */
</style>
