import { it, expect, vi, afterEach } from 'vitest'
import { wsManager } from '../src/lib/ws'
class Socket {
  static OPEN = 1; static CONNECTING = 0
  readyState = 1
  onopen: (() => void) | null = null
  onmessage: ((e: {data:string}) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  static current: Socket
  send = vi.fn()
  constructor() { Socket.current = this }
  close() { this.onclose?.() }
}
afterEach(() => { wsManager.unsubscribe('one'); wsManager.unsubscribe('two'); wsManager.disconnect(); vi.unstubAllGlobals() })
it('routes candle intervals separately and includes interval in unsubscribe', () => {
  vi.stubGlobal('WebSocket', Socket)
  const one=vi.fn(), two=vi.fn()
  wsManager.subscribe('one',{type:'candle',coin:'BTC',interval:'1h'},one)
  wsManager.subscribe('two',{type:'candle',coin:'BTC',interval:'1d'},two)
  Socket.current.onmessage?.({data:JSON.stringify({channel:'candle',data:{s:'BTC',i:'1h',t:1}})})
  expect(one).toHaveBeenCalledOnce(); expect(two).not.toHaveBeenCalled()
  wsManager.unsubscribe('one')
  expect(Socket.current.send).toHaveBeenCalledWith(JSON.stringify({method:'unsubscribe',subscription:{type:'candle',coin:'BTC',interval:'1h'}}))
})
