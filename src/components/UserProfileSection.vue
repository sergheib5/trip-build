<template>
  <div class="bg-white shadow rounded-lg">
    <!-- Profile Header -->
    <div class="px-4 py-5 sm:px-6">
      <div class="flex items-center space-x-4">
        <div
          class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-medium text-white"
        >
          {{ getUserInitials }}
        </div>
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            {{ user.name || 'User' }}
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            {{ user.email }}
          </p>
        </div>
      </div>
    </div>

    <!-- Profile Details -->
    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
      <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">Member since</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ formatDate(user.createdAt) }}
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">Last login</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ formatDate(user.lastLogin) }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Action Buttons -->
    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
      <div class="flex space-x-4">
        <router-link
          to="/settings"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Edit Profile
        </router-link>
        <button
          @click="handleLogout"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStoreAuth } from '@/stores/storeAuth'
import { useRouter } from 'vue-router'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
})

const storeAuth = useStoreAuth()
const router = useRouter()

const getUserInitials = computed(() => {
  if (!props.user.name) return '?'
  return props.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const formatDate = dateString => {
  if (!dateString) return 'Not available'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const handleLogout = () => {
  storeAuth.logoutUser()
  router.push('/auth')
}
</script>
