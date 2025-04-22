<template>
  <div v-if="isReady" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
  <div v-else class="min-h-screen bg-gray-50 flex items-center justify-center">
    <ArrowPathIcon
      class="h-12 w-12 text-blue-500 animate-spin"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
import { useStoreAuth } from '@/stores/storeAuth'
import { onMounted, ref } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/solid'

const storeAuth = useStoreAuth()
const isReady = ref(false)

onMounted(async () => {
  await storeAuth.init()
  isReady.value = true
})
</script>

<style scoped>
.spinner-container {
  width: 100px;
  height: 100px;
  position: relative;
}

.spinner {
  width: 100%;
  height: 100%;
  position: relative;
}

.double-bounce1,
.double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: hsl(217, 91%, 60%);
  /* Tailwind blue-500 */
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: sk-bounce 2s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1s;
}

@keyframes sk-bounce {
  0%,
  100% {
    transform: scale(0);
  }

  50% {
    transform: scale(1);
  }
}
</style>
