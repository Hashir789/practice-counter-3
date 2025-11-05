import { useState, useEffect, useRef } from 'react'
import './App.css'
import { apiService } from './services/api'
import { socketIOService, type SocketIOMessage } from './services/socketio'

const MAX_COUNT = 10

function App() {
  const [count, setCount] = useState(0)
  const [healthStatus, setHealthStatus] = useState<string>('')
  const [addResult, setAddResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [socketStatus, setSocketStatus] = useState<string>('disconnected')
  const [socketMessages, setSocketMessages] = useState<SocketIOMessage[]>([])
  const socketServiceRef = useRef(socketIOService)

  useEffect(() => {
    // Check API health on mount
    apiService
      .getHealth()
      .then(response => {
        setHealthStatus(response.message)
      })
      .catch(err => {
        setError(`Health check failed: ${err.message}`)
      })

    // Setup Socket.IO handlers
    const socket = socketServiceRef.current

    const unsubscribeStatus = socket.onStatusChange(status => {
      setSocketStatus(status)
    })

    const unsubscribeMessage = socket.onMessage(message => {
      setSocketMessages(prev => [...prev.slice(-9), message]) // Keep last 10 messages

      // Handle specific message types
      if (
        message.type === 'add' &&
        message.data &&
        typeof message.data === 'object' &&
        'result' in message.data
      ) {
        setAddResult((message.data as { result: number }).result)
      } else if (
        message.type === 'health' &&
        message.data &&
        typeof message.data === 'object' &&
        'message' in message.data
      ) {
        setHealthStatus((message.data as { message: string }).message)
      } else if (message.type === 'add-result') {
        // Handle add result response
        if (
          message.data &&
          typeof message.data === 'object' &&
          'result' in message.data
        ) {
          setAddResult((message.data as { result: number }).result)
        }
      }
    })

    const unsubscribeError = socket.onError(err => {
      // Log Socket.IO errors with helpful context
      if (err instanceof Error) {
        console.warn('Socket.IO connection error:', err.message)
      } else {
        console.warn('Socket.IO error:', err)
      }
    })

    // Listen for specific events
    const unsubscribeAdd = socket.on('add-result', (data: unknown) => {
      if (data && typeof data === 'object' && 'result' in data) {
        setAddResult((data as { result: number }).result)
      }
    })

    const unsubscribeHealth = socket.on('health-response', (data: unknown) => {
      if (data && typeof data === 'object' && 'message' in data) {
        setHealthStatus((data as { message: string }).message)
      }
    })

    // Connect Socket.IO
    try {
      socket.connect()
    } catch (error) {
      console.warn('Socket.IO connection failed:', error)
    }

    // Cleanup on unmount
    return () => {
      unsubscribeStatus()
      unsubscribeMessage()
      unsubscribeError()
      unsubscribeAdd()
      unsubscribeHealth()
      if (socket.isConnected() || socket.getStatus() === 'connecting') {
        socket.disconnect()
      }
    }
  }, [])

  const handleIncrement = () => {
    setCount(prevCount => {
      const newCount = prevCount + 1
      // Reset to 0 after reaching MAX_COUNT
      return newCount >= MAX_COUNT ? 0 : newCount
    })
  }

  const handleAddNumbers = async () => {
    setLoading(true)
    setError('')
    setAddResult(null)

    try {
      // Use the current count and 5 as the two numbers to add
      const result = await apiService.addNumbers(count, 5)
      setAddResult(result.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add numbers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNumbersViaSocket = () => {
    const socket = socketServiceRef.current
    if (!socket.isConnected()) {
      setError('Socket.IO is not connected. Attempting to connect...')
      try {
        socket.connect()
      } catch {
        setError('Socket.IO connection failed. Please check your connection.')
      }
      return
    }

    try {
      socket.sendAddNumbers(count, 5)
      setError('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send via Socket.IO'
      )
    }
  }

  const handleSocketHealthCheck = () => {
    const socket = socketServiceRef.current
    if (!socket.isConnected()) {
      setError('Socket.IO is not connected. Attempting to connect...')
      try {
        socket.connect()
      } catch {
        setError('Socket.IO connection failed. Please check your connection.')
      }
      return
    }

    try {
      socket.sendHealthCheck()
      setError('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send health check via Socket.IO'
      )
    }
  }

  return (
    <div className="app">
      <h1>Practice Counter App</h1>

      <div className="connection-status">
        <div className="health-status" data-testid="health-status">
          API Status: {healthStatus || 'Checking...'}
        </div>
        <div
          className={`ws-status ws-status-${socketStatus}`}
          data-testid="socket-status"
        >
          Socket.IO: {socketStatus}
          {socketServiceRef.current.isConnected() &&
            socketServiceRef.current.getSocketId() && (
              <span
                style={{ fontSize: '0.8em', marginLeft: '8px', opacity: 0.8 }}
              >
                (ID: {socketServiceRef.current.getSocketId()?.slice(0, 8)}...)
              </span>
            )}
        </div>
      </div>

      {error && (
        <div className="error" data-testid="error-message">
          {error}
        </div>
      )}

      <div className="card">
        <div className="counter-display" data-testid="counter-display">
          Count: {count}
        </div>
        <button
          onClick={handleIncrement}
          className="increment-button"
          data-testid="increment-button"
        >
          Increment
        </button>
        <p className="hint">
          The counter will reset to 0 after reaching {MAX_COUNT}
        </p>
      </div>

      <div className="card">
        <h2>HTTP API Integration</h2>
        <p>Add current count ({count}) + 5 using HTTP API:</p>
        <button
          onClick={handleAddNumbers}
          disabled={loading}
          className="add-button"
          data-testid="add-button"
        >
          {loading ? 'Adding...' : 'Add Numbers via HTTP'}
        </button>
        {addResult !== null && (
          <div className="add-result" data-testid="add-result">
            Result: {addResult}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Socket.IO Integration</h2>
        <p>Add current count ({count}) + 5 using Socket.IO:</p>
        <div className="ws-buttons">
          <button
            onClick={handleAddNumbersViaSocket}
            disabled={!socketServiceRef.current.isConnected()}
            className="ws-button"
            data-testid="socket-add-button"
          >
            Add Numbers via Socket.IO
          </button>
          <button
            onClick={handleSocketHealthCheck}
            disabled={!socketServiceRef.current.isConnected()}
            className="ws-button"
            data-testid="socket-health-button"
          >
            Health Check via Socket.IO
          </button>
        </div>
        {socketMessages.length > 0 && (
          <div className="ws-messages" data-testid="socket-messages">
            <h3>Recent Socket.IO Messages:</h3>
            <div className="ws-messages-list">
              {socketMessages.map((msg, idx) => (
                <div key={idx} className="ws-message">
                  <span className="ws-message-type">{msg.type}</span>:{' '}
                  {JSON.stringify(msg.data || {})}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
