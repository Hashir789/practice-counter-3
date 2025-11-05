// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV
  ? '/api' // Use Vite proxy in development
  : 'https://d1tdizimiz2qsf.cloudfront.net/api' // Direct URL in production

export interface HealthResponse {
  status: string
  message: string
}

export interface WelcomeResponse {
  message: string
  apiBase?: string
}

export interface AddResponse {
  result: number
}

export interface ErrorResponse {
  error: string
}

export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'CORS error: Unable to connect to API. Make sure the backend allows requests from this origin, or use a proxy in development.'
        )
      }
      throw error
    }
  }

  async getWelcome(): Promise<WelcomeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'CORS error: Unable to connect to API. Make sure the backend allows requests from this origin, or use a proxy in development.'
        )
      }
      throw error
    }
  }

  async addNumbers(a: number, b: number): Promise<AddResponse> {
    try {
      const params = new URLSearchParams({ a: a.toString(), b: b.toString() })
      const response = await fetch(`${this.baseUrl}/add?${params}`)

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'CORS error: Unable to connect to API. Make sure the backend allows requests from this origin, or use a proxy in development.'
        )
      }
      throw error
    }
  }
}

// Export a default instance
export const apiService = new ApiService()
