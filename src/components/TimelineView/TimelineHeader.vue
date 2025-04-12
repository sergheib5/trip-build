<template>
  <div class="day-headers">
    <div class="time-header-spacer">
      <button class="nav-button prev-button" @click="$emit('previous')">
        &lt;
      </button>
    </div>
    <div
      v-for="day in visibleDays"
      :key="day.date"
      class="day-header"
      :class="{ 'current-day': isCurrentDay(day.date) }"
    >
      <div class="day-name">{{ day.dayName }}</div>
      <div class="day-number">{{ day.dayNumber }}</div>
    </div>
    <button class="nav-button next-button" @click="$emit('next')">&gt;</button>
  </div>
</template>

<script setup>
const props = defineProps({
  visibleDays: {
    type: Array,
    required: true,
  },
  currentDate: {
    type: Date,
    required: true,
  },
})

defineEmits(['previous', 'next'])

const isCurrentDay = date => {
  return date.toDateString() === props.currentDate.toDateString()
}
</script>

<style scoped>
.day-headers {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  height: 60px;
}

.time-header-spacer {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  position: relative;
  height: 60px;
  display: flex;
  align-items: center;
}

.day-header {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-right: 1px solid #e0e0e0;
  min-width: 0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.day-header:last-child {
  border-right: none;
}

.current-day {
  background-color: #e8f0fe;
  color: #1a73e8;
}

.day-name {
  font-size: 0.75rem;
  color: #5f6368;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-number {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1;
}

.nav-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #5f6368;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
}

.nav-button:hover {
  background-color: #f1f3f4;
  color: #1a73e8;
}

.prev-button {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.next-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
