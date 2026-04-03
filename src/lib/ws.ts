import { WS_URL } from '../config/hyperliquid'

type MessageHandler = (data: unknown) => void

interface Subscription {
  id: string
  channel: string
  coin?: string
  handler: MessageHandler
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private subscriptions = new Map<string, Subscription>()
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return

    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
      for (const sub of this.subscriptions.values()) {
        this.sendSubscribe(sub)
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        // Skip subscription confirmations
        if (msg.channel === 'subscriptionResponse') return
        if (!msg.channel) return

        const channel = msg.channel as string
        const data = msg.data

        // For trades channel, data is an array of trades (no coin key inside)
        // For l2Book, data has { coin, levels }
        // For candle, data has { t, T, s, ... } with s=coin
        let coin: string | undefined
        if (channel === 'l2Book') {
          coin = data?.coin
        } else if (channel === 'candle') {
          coin = data?.s
        } else if (channel === 'trades') {
          // trades data is an array, coin is in each trade object
          coin = Array.isArray(data) && data.length > 0 ? data[0].coin : undefined
        }

        for (const sub of this.subscriptions.values()) {
          if (sub.channel === channel && (!sub.coin || sub.coin === coin)) {
            sub.handler(data)
          }
        }
      } catch {
        // ignore
      }
    }

    this.ws.onclose = () => {
      this.ws = null
      this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  private sendSubscribe(sub: Subscription) {
    const subscription: Record<string, unknown> = { type: sub.channel }
    if (sub.coin) subscription.coin = sub.coin
    // candle subscriptions also need interval
    if ((sub as unknown as { interval?: string }).interval) {
      subscription.interval = (sub as unknown as { interval: string }).interval
    }
    this.ws?.send(JSON.stringify({ method: 'subscribe', subscription }))
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
      this.connect()
    }, this.reconnectDelay)
  }

  subscribe(id: string, params: { type: string; coin?: string; interval?: string }, handler: MessageHandler) {
    const sub: Subscription & { interval?: string } = {
      id,
      channel: params.type,
      coin: params.coin,
      interval: params.interval,
      handler,
    }
    this.subscriptions.set(id, sub)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(sub)
    } else {
      this.connect()
    }
  }

  unsubscribe(id: string) {
    const sub = this.subscriptions.get(id)
    if (sub && this.ws?.readyState === WebSocket.OPEN) {
      const subscription: Record<string, unknown> = { type: sub.channel }
      if (sub.coin) subscription.coin = sub.coin
      this.ws.send(JSON.stringify({ method: 'unsubscribe', subscription }))
    }
    this.subscriptions.delete(id)
    if (this.subscriptions.size === 0) {
      this.disconnect()
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.ws?.close()
    this.ws = null
  }
}

export const wsManager = new WebSocketManager()
