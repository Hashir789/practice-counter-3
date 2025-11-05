import { useState } from 'react'
import './App.css'

const MAX_COUNT = 10

function App() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => {
    setCount(prevCount => {
      const newCount = prevCount + 1
      // Reset to 0 after reaching MAX_COUNT
      return newCount >= MAX_COUNT ? 0 : newCount
    })
  }

  return (
    <div className="app">
      <h1>Counter App</h1>
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
    </div>
  )
}

export default App
