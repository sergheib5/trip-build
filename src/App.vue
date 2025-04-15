<template>
  <div class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>

<script setup>
import { useStoreAuth } from '@/stores/storeAuth'
import { onMounted } from 'vue'

const storeAuth = useStoreAuth()

onMounted(() => {
  storeAuth.init()
})
</script>

<style>
@import './assets/styles/main.css';
body {
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>
