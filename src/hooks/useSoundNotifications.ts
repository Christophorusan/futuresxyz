import { useEffect, useRef } from 'react'
import { useAccountData } from './useAccountData'

// Simple beep using Web Audio API
function playSound(type: 'fill' | 'cancel') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'fill') {
      osc.frequency.value = 800
      gain.gain.value = 0.1
    } else {
      osc.frequency.value = 400
      gain.gain.value = 0.08
    }

    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch {
    // Audio not available
  }
}

export function useSoundNotifications() {
  const { fills } = useAccountData()
  const prevFillCount = useRef(fills.length)

  useEffect(() => {
    if (fills.length > prevFillCount.current && prevFillCount.current > 0) {
      playSound('fill')
    }
    prevFillCount.current = fills.length
  }, [fills.length])
}
