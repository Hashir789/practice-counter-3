// Convert HTTPS URL to WSS (WebSocket Secure)
function getWebSocketUrl(apiUrl: string): string {
  // Always connect directly to the backend WebSocket URL
  // Convert https:// to wss:// or http:// to ws://
  const url = new URL(apiUrl)
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${url.host}${url.pathname}`
}

export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export interface WebSocketMessage {
  type: string
  data?: unknown
  timestamp?: number
}

export type MessageHandler = (message: WebSocketMessage) => void
export type ErrorHandler = (error: Event | Error) => void
export type StatusChangeHandler = (status: WebSocketStatus) => void

export class WebSocketService {
  private socket: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private status: WebSocketStatus = 'disconnected'
  private messageHandlers: MessageHandler[] = []
  private errorHandlers: ErrorHandler[] = []
  private statusChangeHandlers: StatusChangeHandler[] = []

  constructor(
    apiBaseUrl: string = 'https://d1tdizimiz2qsf.cloudfront.net/api'
  ) {
    this.url = getWebSocketUrl(apiBaseUrl)
  }

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    if (this.socket?.readyState === WebSocket.CONNECTING) {
      return // Already connecting
    }

    this.setStatus('connecting')

    try {
      this.socket = new WebSocket(this.url)

      // Set timeout for connection - if it takes too long, assume server doesn't support WS
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          this.socket.close()
          this.setStatus('disconnected')
          // Don't attempt reconnect if server doesn't support WebSocket
          this.reconnectAttempts = this.maxReconnectAttempts
        }
      }, 5000) // 5 second timeout

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout)
        this.setStatus('connected')
        this.reconnectAttempts = 0
      }

      this.socket.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.notifyMessageHandlers(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.socket.onerror = () => {
        clearTimeout(connectionTimeout)
        this.setStatus('error')
        // Extract more useful error information
        const errorMessage = this.getWebSocketErrorMessage()
        const enhancedError = new Error(errorMessage)
        this.notifyErrorHandlers(enhancedError)
      }

      this.socket.onclose = event => {
        clearTimeout(connectionTimeout)
        this.setStatus('disconnected')

        // Log close reason for debugging
        if (event.code !== 1000) {
          // 1000 = normal closure
          const closeReason = this.getCloseReason(event.code)
          console.warn(`WebSocket closed: ${closeReason} (code: ${event.code})`)
        }

        // Only attempt reconnect if it wasn't a connection refused error
        // Code 1006 = abnormal closure (connection refused, server doesn't support WS)
        if (
          event.code !== 1006 &&
          event.code !== 1002 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.attemptReconnect()
        } else {
          // Server likely doesn't support WebSocket, stop trying
          this.reconnectAttempts = this.maxReconnectAttempts
          console.info(
            'WebSocket reconnection stopped. Backend may not support WebSocket. HTTP API is available.'
          )
        }
      }
    } catch (error) {
      this.setStatus('error')
      this.notifyErrorHandlers(
        error instanceof Error
          ? error
          : new Error('WebSocket connection failed')
      )
    }
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent reconnection
    if (this.socket) {
      // Only close if not already closed
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        try {
          this.socket.close()
        } catch {
          // Ignore errors during cleanup
        }
      }
      this.socket = null
    }
    this.setStatus('disconnected')
  }

  send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      throw new Error('WebSocket is not connected')
    }
  }

  sendAddNumbers(a: number, b: number): void {
    this.send({
      type: 'add',
      data: { a, b },
      timestamp: Date.now(),
    })
  }

  sendHealthCheck(): void {
    this.send({
      type: 'health',
      timestamp: Date.now(),
    })
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler)
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler)
    }
  }

  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusChangeHandlers.push(handler)
    return () => {
      this.statusChangeHandlers = this.statusChangeHandlers.filter(
        h => h !== handler
      )
    }
  }

  getStatus(): WebSocketStatus {
    return this.status
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status
      this.notifyStatusChangeHandlers(status)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      if (this.status === 'disconnected') {
        this.connect()
      }
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  private notifyMessageHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => handler(message))
  }

  private notifyErrorHandlers(error: Event | Error): void {
    this.errorHandlers.forEach(handler => handler(error))
  }

  private notifyStatusChangeHandlers(status: WebSocketStatus): void {
    this.statusChangeHandlers.forEach(handler => handler(status))
  }

  private getWebSocketErrorMessage(): string {
    // Try to get more specific error information
    if (this.socket) {
      const state = this.socket.readyState

      if (state === WebSocket.CLOSED) {
        return `WebSocket connection failed to ${this.url}. Possible reasons:
1. Backend doesn't support WebSocket at this endpoint
2. CloudFront WebSocket support not enabled (check CloudFront distribution settings)
3. WebSocket endpoint might be at different path (e.g., /ws, /api/ws, /socket.io)
4. Firewall or security group blocking WebSocket connections

The HTTP API will continue to work normally.`
      }
    }

    return `WebSocket connection error. The backend may not support WebSocket connections. HTTP API is still available.`
  }

  private getCloseReason(code: number): string {
    const reasons: Record<number, string> = {
      1000: 'Normal Closure',
      1001: 'Going Away',
      1002: 'Protocol Error',
      1003: 'Unsupported Data',
      1006: 'Abnormal Closure (Connection Refused)',
      1007: 'Invalid Data',
      1008: 'Policy Violation',
      1009: 'Message Too Big',
      1010: 'Extension Error',
      1011: 'Internal Server Error',
    }
    return reasons[code] || `Unknown (${code})`
  }
}

// Export a default instance
export const webSocketService = new WebSocketService()
