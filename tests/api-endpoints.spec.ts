import { test, expect } from '@playwright/test'

const API_BASE_URL = 'https://d1tdizimiz2qsf.cloudfront.net/api'

test.describe('API Endpoints', () => {
  test.describe('GET /api/health', () => {
    test('should return health status', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`)
      
      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.status).toBe('ok')
      expect(body.message).toBe('Server is running')
    })
  })

  test.describe('GET /api/', () => {
    test('should return welcome message', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/`)
      
      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.message).toContain('Practice API')
    })
  })

  test.describe('GET /api/add', () => {
    test('should add two numbers', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/add?a=5&b=3`)
      
      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.result).toBe(8)
    })

    test('should return 400 for invalid parameters', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/add?a=abc&b=3`)
      
      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid parameters')
    })
  })
})

