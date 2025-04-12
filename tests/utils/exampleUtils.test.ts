import { describe, it, expect } from 'vitest'
import { formatDate, calculateDistance } from '@/utils/exampleUtils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-01')
      expect(formatDate(date)).toBe('01/01/2024')
    })
  })

  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      const point1 = { lat: 0, lng: 0 }
      const point2 = { lat: 1, lng: 1 }
      expect(calculateDistance(point1, point2)).toBeCloseTo(157.225, 2)
    })
  })
}) 