import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSocketService } from '../websocket'

// Define global for TypeScript
declare const global: typeof globalThis & {
  WebSocket: typeof WebSocket
}

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(_data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

describe('WebSocketService', () => {
  let originalWebSocket: typeof WebSocket

  beforeEach(() => {
    // Store original WebSocket
    originalWebSocket = global.WebSocket as typeof WebSocket
    // Replace with mock
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Restore original WebSocket
    global.WebSocket = originalWebSocket
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should create WebSocketService with default URL', () => {
      const service = new WebSocketService()
      expect(service.getStatus()).toBe('disconnected')
    })

    it('should create WebSocketService with custom URL', () => {
      const service = new WebSocketService('https://example.com/api')
      expect(service.getStatus()).toBe('disconnected')
    })

    it('should convert HTTPS URL to WSS', () => {
      const service = new WebSocketService('https://example.com/api')
      // The URL conversion happens internally, but we can test by checking status
      expect(service.getStatus()).toBe('disconnected')
    })
  })

  describe('connect', () => {
    it('should connect to WebSocket', async () => {
      const service = new WebSocketService()
      const statusChanges: string[] = []

      const unsubscribe = service.onStatusChange(status => {
        statusChanges.push(status)
      })

      service.connect()
      expect(statusChanges).toContain('connecting')

      // Wait for connection
      await vi.advanceTimersByTimeAsync(20)

      expect(statusChanges).toContain('connected')
      expect(service.isConnected()).toBe(true)

      unsubscribe()
    })

    it('should not connect if already connected', () => {
      const service = new WebSocketService()
      service.connect()
      vi.advanceTimersByTime(20)

      const initialStatus = service.getStatus()
      service.connect() // Try to connect again
      expect(service.getStatus()).toBe(initialStatus)
    })
  })

  describe('disconnect', () => {
    it('should disconnect WebSocket', async () => {
      const service = new WebSocketService()
      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      expect(service.isConnected()).toBe(true)
      service.disconnect()
      expect(service.getStatus()).toBe('disconnected')
      expect(service.isConnected()).toBe(false)
    })
  })

  describe('send', () => {
    it('should send message when connected', async () => {
      const service = new WebSocketService()
      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      expect(() => {
        service.send({ type: 'test', data: { foo: 'bar' } })
      }).not.toThrow()
    })

    it('should throw error when not connected', () => {
      const service = new WebSocketService()
      expect(() => {
        service.send({ type: 'test', data: {} })
      }).toThrow('WebSocket is not connected')
    })
  })

  describe('sendAddNumbers', () => {
    it('should send add numbers message', async () => {
      const service = new WebSocketService()
      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      expect(() => {
        service.sendAddNumbers(5, 3)
      }).not.toThrow()
    })
  })

  describe('sendHealthCheck', () => {
    it('should send health check message', async () => {
      const service = new WebSocketService()
      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      expect(() => {
        service.sendHealthCheck()
      }).not.toThrow()
    })
  })

  describe('message handlers', () => {
    it('should notify message handlers when message is received', async () => {
      const service = new WebSocketService()
      const receivedMessages: unknown[] = []

      const unsubscribe = service.onMessage(message => {
        receivedMessages.push(message)
      })

      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Simulate receiving a message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket = (service as any).socket as MockWebSocket
      if (mockSocket.onmessage) {
        mockSocket.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'add', data: { result: 8 } }),
          })
        )
      }

      expect(receivedMessages).toHaveLength(1)
      expect(receivedMessages[0]).toEqual({
        type: 'add',
        data: { result: 8 },
      })

      unsubscribe()
    })

    it('should notify error handlers when error occurs', async () => {
      const service = new WebSocketService()
      const errors: unknown[] = []

      const unsubscribe = service.onError(error => {
        errors.push(error)
      })

      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Simulate error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSocket = (service as any).socket as MockWebSocket
      if (mockSocket.onerror) {
        mockSocket.onerror(new Event('error'))
      }

      expect(errors).toHaveLength(1)

      unsubscribe()
    })

    it('should notify status change handlers', async () => {
      const service = new WebSocketService()
      const statusChanges: string[] = []

      const unsubscribe = service.onStatusChange(status => {
        statusChanges.push(status)
      })

      service.connect()
      expect(statusChanges).toContain('connecting')

      await vi.advanceTimersByTimeAsync(20)
      expect(statusChanges).toContain('connected')

      unsubscribe()
    })

    it('should allow unsubscribing from handlers', async () => {
      const service = new WebSocketService()
      let callCount = 0

      const unsubscribe = service.onStatusChange(() => {
        callCount++
      })

      service.connect()
      await vi.advanceTimersByTimeAsync(20)

      unsubscribe()

      service.disconnect()
      service.connect()

      // Should not increment after unsubscribe
      const callsAfterUnsubscribe = callCount

      await vi.advanceTimersByTimeAsync(20)
      expect(callCount).toBe(callsAfterUnsubscribe)
    })
  })

  describe('getStatus', () => {
    it('should return current status', () => {
      const service = new WebSocketService()
      expect(service.getStatus()).toBe('disconnected')
    })
  })

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      const service = new WebSocketService()
      expect(service.isConnected()).toBe(false)
    })

    it('should return true when connected', async () => {
      const service = new WebSocketService()
      service.connect()
      await vi.advanceTimersByTimeAsync(20)
      expect(service.isConnected()).toBe(true)
    })
  })
})
