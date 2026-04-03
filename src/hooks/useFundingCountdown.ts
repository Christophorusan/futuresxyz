import { useState, useEffect } from 'react'

export function useFundingCountdown() {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const nextHour = Math.ceil(now / 3600000) * 3600000
      const diff = nextHour - now
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setCountdown(`${mins}m ${secs.toString().padStart(2, '0')}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return countdown
}
