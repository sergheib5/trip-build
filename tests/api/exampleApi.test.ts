import { describe, it, expect, vi } from 'vitest'
import { fetchTripData, saveTripData } from '@/api/tripApi'

describe('Trip API', () => {
  describe('fetchTripData', () => {
    it('fetches trip data successfully', async () => {
      const mockResponse = { id: 1, name: 'Test Trip' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await fetchTripData(1)
      expect(result).toEqual(mockResponse)
    })

    it('handles fetch errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      await expect(fetchTripData(1)).rejects.toThrow('Network error')
    })
  })

  describe('saveTripData', () => {
    it('saves trip data successfully', async () => {
      const mockTrip = { name: 'New Trip' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...mockTrip, id: 1 })
      })

      const result = await saveTripData(mockTrip)
      expect(result.id).toBe(1)
    })
  })
}) 