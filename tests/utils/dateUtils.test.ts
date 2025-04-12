import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '@/utils/dateUtils'

describe('Date Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date(Date.UTC(2024, 0, 1))
      expect(formatDate(date)).toBe('01/01/2024')
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date(Date.UTC(2024, 0, 1, 12, 30))
      // The time will be in UTC, so we expect 12:30 PM
      expect(formatDateTime(date)).toBe('01/01/2024, 12:30 PM')
    })

    it('formats midnight correctly', () => {
      const date = new Date(Date.UTC(2024, 0, 1, 0, 0))
      expect(formatDateTime(date)).toBe('01/01/2024, 12:00 AM')
    })

    it('formats noon correctly', () => {
      const date = new Date(Date.UTC(2024, 0, 1, 12, 0))
      expect(formatDateTime(date)).toBe('01/01/2024, 12:00 PM')
    })
  })
}) 