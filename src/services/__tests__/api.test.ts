import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiService } from '../api'

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getHealth', () => {
    it('should return health status', async () => {
      const mockResponse = {
        status: 'ok',
        message: 'Server is running',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      })

      const apiService = new ApiService()
      const result = await apiService.getHealth()

      expect(result.status).toBe('ok')
      expect(result.message).toBe('Server is running')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://d1tdizimiz2qsf.cloudfront.net/api/health'
      )
    })

    it('should throw error on failed request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      const apiService = new ApiService()

      await expect(apiService.getHealth()).rejects.toThrow(
        'HTTP error! status: 500'
      )
    })
  })

  describe('getWelcome', () => {
    it('should return welcome message', async () => {
      const mockResponse = {
        message: 'Welcome to Practice API',
        apiBase: 'https://d1tdizimiz2qsf.cloudfront.net/api',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      })

      const apiService = new ApiService()
      const result = await apiService.getWelcome()

      expect(result.message).toContain('Practice API')
      expect(result.apiBase).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        'https://d1tdizimiz2qsf.cloudfront.net/api/'
      )
    })

    it('should throw error on failed request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const apiService = new ApiService()

      await expect(apiService.getWelcome()).rejects.toThrow(
        'HTTP error! status: 404'
      )
    })
  })

  describe('addNumbers', () => {
    it('should add two numbers correctly', async () => {
      const mockResponse = {
        result: 8,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      })

      const apiService = new ApiService()
      const result = await apiService.addNumbers(5, 3)

      expect(result.result).toBe(8)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://d1tdizimiz2qsf.cloudfront.net/api/add?a=5&b=3'
      )
    })

    it('should return 400 error for invalid parameters', async () => {
      const mockErrorResponse = {
        error: 'Invalid parameters',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(mockErrorResponse),
      })

      const apiService = new ApiService()

      await expect(apiService.addNumbers(NaN, 3)).rejects.toThrow(
        'Invalid parameters'
      )
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const apiService = new ApiService()

      await expect(apiService.addNumbers(5, 3)).rejects.toThrow('Network error')
    })
  })

  describe('custom base URL', () => {
    it('should use custom base URL when provided', async () => {
      const mockResponse = { status: 'ok', message: 'Server is running' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      })

      const apiService = new ApiService('http://localhost:3000/api')
      await apiService.getHealth()

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/health'
      )
    })
  })
})
