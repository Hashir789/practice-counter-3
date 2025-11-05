import { io, Socket } from 'socket.io-client'

// Use proxy in development, direct URL in production
// Note: Base URL should NOT include /api - that's passed as path option
const SOCKET_BASE_URL = import.meta.env.DEV
  ? '' // Use Vite proxy - will connect to same origin
  : 'https://d1tdizimiz2qsf.cloudfront.net' // Direct URL in production

export type SocketIOStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export interface SocketIOMessage {
  type: string
  data?: unknown
  timestamp?: number
}

export type MessageHandler = (message: SocketIOMessage) => void
export type ErrorHandler = (error: Error | string) => void
export type StatusChangeHandler = (status: SocketIOStatus) => void

export class SocketIOService {
  private socket: Socket | null = null
  private url: string
  private status: SocketIOStatus = 'disconnected'
  private messageHandlers: MessageHandler[] = []
  private errorHandlers: ErrorHandler[] = []
  private statusChangeHandlers: StatusChangeHandler[] = []
  private pendingListeners: Array<{
    event: string
    handler: (data: unknown) => void
  }> = []

  constructor(socketUrl: string = SOCKET_BASE_URL) {
    // In development, use window location (Vite proxy)
    // In production, use the CloudFront URL
    // if (import.meta.env.DEV && !socketUrl) {
    //   this.url = typeof window !== 'undefined' ? window.location.origin : ''
    // } else {
    this.url = socketUrl || 'https://d1tdizimiz2qsf.cloudfront.net'
    // }
  }

  connect(): void {
    if (this.socket?.connected) {
      return // Already connected
    }

    if (this.socket?.active) {
      return // Already connecting
    }

    this.setStatus('connecting')

    try {
      // Socket.IO configuration
      // Use path option instead of including it in URL
      this.socket = io(this.url, {
        path: '/api/socket.io', // Socket.IO path
        transports: ['websocket'], // Use WebSocket only (as per your working example)
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
      })

      // Attach any pending listeners that were registered before connection
      this.pendingListeners.forEach(({ event, handler }) => {
        this.socket?.on(event, handler)
      })
      this.pendingListeners = []

      this.socket.on('connect', () => {
        this.setStatus('connected')
        console.log('Connected via CloudFront!', this.socket?.id)
      })

      this.socket.on('disconnect', reason => {
        this.setStatus('disconnected')
        console.log('Socket.IO disconnected:', reason)

        if (reason === 'io server disconnect') {
          // Server disconnected the socket, need to manually reconnect
          this.socket?.connect()
        }
      })

      this.socket.on('connect_error', error => {
        this.setStatus('error')
        console.error('Socket.IO connection error:', error.message)
        this.notifyErrorHandlers(error)
      })

      // Listen for welcome message
      this.socket.on('welcome', msg => {
        console.log('Message:', msg)
        const message: SocketIOMessage = {
          type: 'welcome',
          data: msg,
          timestamp: Date.now(),
        }
        this.notifyMessageHandlers(message)
      })

      // Listen for custom messages
      this.socket.onAny((eventName, ...args) => {
        // Skip internal Socket.IO events
        if (
          eventName.startsWith('connect') ||
          eventName.startsWith('disconnect') ||
          eventName === 'error'
        ) {
          return
        }
        const message: SocketIOMessage = {
          type: eventName,
          data: args[0] || {},
          timestamp: Date.now(),
        }
        this.notifyMessageHandlers(message)
      })

      // Generic error handler
      this.socket.on('error', error => {
        this.setStatus('error')
        this.notifyErrorHandlers(error)
      })
    } catch (error) {
      this.setStatus('error')
      this.notifyErrorHandlers(
        error instanceof Error
          ? error
          : new Error('Socket.IO connection failed')
      )
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.setStatus('disconnected')
  }

  // Send a message via Socket.IO
  emit(eventName: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data)
    } else {
      throw new Error('Socket.IO is not connected')
    }
  }

  // Listen for specific events
  on(eventName: string, handler: (data: unknown) => void): () => void {
    // If socket exists (even if not connected), attach listener immediately
    // Socket.IO allows registering listeners before connection
    if (this.socket) {
      this.socket.on(eventName, handler)
    } else {
      // Queue listener to be attached when socket is created
      this.pendingListeners.push({ event: eventName, handler })
    }

    // Return unsubscribe function
    return () => {
      if (this.socket) {
        this.socket.off(eventName, handler)
      }
      // Also remove from pending listeners if not yet attached
      this.pendingListeners = this.pendingListeners.filter(
        l => !(l.event === eventName && l.handler === handler)
      )
    }
  }

  // Remove listener
  off(eventName: string, handler?: (data: unknown) => void): void {
    if (this.socket) {
      if (handler) {
        this.socket.off(eventName, handler)
      } else {
        this.socket.off(eventName)
      }
    }
  }

  // Convenience methods for your API
  sendAddNumbers(a: number, b: number): void {
    this.emit('add', { a, b })
  }

  sendHealthCheck(): void {
    this.emit('health')
  }

  // Generic message handler subscription
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

  getStatus(): SocketIOStatus {
    return this.status
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  getSocketId(): string | undefined {
    return this.socket?.id
  }

  private setStatus(status: SocketIOStatus): void {
    if (this.status !== status) {
      this.status = status
      this.notifyStatusChangeHandlers(status)
    }
  }

  private notifyMessageHandlers(message: SocketIOMessage): void {
    this.messageHandlers.forEach(handler => handler(message))
  }

  private notifyErrorHandlers(error: Error | string): void {
    const errorMessage = error instanceof Error ? error : new Error(error)
    this.errorHandlers.forEach(handler => handler(errorMessage))
  }

  private notifyStatusChangeHandlers(status: SocketIOStatus): void {
    this.statusChangeHandlers.forEach(handler => handler(status))
  }
}

// Export a default instance
export const socketIOService = new SocketIOService()
