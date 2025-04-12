import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExampleStore } from '@/stores/example'

describe('Example Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = useExampleStore()
    expect(store.count).toBe(0)
  })

  it('increments count', () => {
    const store = useExampleStore()
    store.increment()
    expect(store.count).toBe(1)
  })
}) 