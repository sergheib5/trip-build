import { describe, it, expect } from 'vitest'
import { calculateDistance } from '@/utils/locationUtils'

describe('Location Utility Functions', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      const point1 = { lat: 0, lng: 0 }
      const point2 = { lat: 1, lng: 1 }
      expect(calculateDistance(point1, point2)).toBeCloseTo(157.249, 2)
    })

    it('returns 0 for the same point', () => {
      const point = { lat: 40.7128, lng: -74.0060 }
      expect(calculateDistance(point, point)).toBe(0)
    })

    it('calculates distance between New York and Los Angeles', () => {
      const ny = { lat: 40.7128, lng: -74.0060 }
      const la = { lat: 34.0522, lng: -118.2437 }
      expect(calculateDistance(ny, la)).toBeCloseTo(3935.75, 2)
    })
  })
}) 