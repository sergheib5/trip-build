<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <UserProfileSection :user="storeAuth.user" />
    </div>
  </div>
</template>

<script setup>
import { useStoreAuth } from '@/stores/storeAuth'
import UserProfileSection from '@/components/UserProfileSection.vue'

const storeAuth = useStoreAuth()
</script> 