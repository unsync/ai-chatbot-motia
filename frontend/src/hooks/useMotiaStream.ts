import { useEffect, useState, useRef } from 'react'
import {Stream, StreamItemSubscription} from '@motiadev/stream-client-browser'

interface StreamMessage {
  id: string
  message: string
  delta?: string // New field for streaming chunks
  from: 'user' | 'assistant'
  status: 'created' | 'streaming' | 'completed'
  timestamp: string
}

export function useMotiaStream(serverUrl: string = 'ws://localhost:3000') {
  const [isConnected, setIsConnected] = useState(false)
  const streamRef = useRef<Stream | null>(null)
  const subscriptionsRef = useRef<Map<string, StreamItemSubscription<StreamMessage>>>(new Map())

  useEffect(() => {
    console.log('Connecting to Motia stream server:', serverUrl)

    const stream = new Stream(serverUrl)
    streamRef.current = stream

    // We can't directly access the ws property, so we'll assume connection
    // The stream client should handle connection internally
    setIsConnected(true)
    console.log('✅ Motia Stream initialized')

    return () => {
      console.log('🧹 Cleaning up Motia Stream connection')
      subscriptionsRef.current.forEach((sub) => {
        if (sub.close) sub.close()
      })
      subscriptionsRef.current.clear()
      stream.close()
    }
  }, [serverUrl])

  const subscribeToStreamItem = (
    streamName: string,
    groupId: string,
    id: string,
    callback: (data: StreamMessage) => void
  ) => {
    if (!streamRef.current || !isConnected) {
      console.warn('❌ Stream not connected, cannot subscribe')
      return
    }

    console.log('🔗 Subscribing to stream item:', { streamName, groupId, id })

    try {
      // Subscribe to the specific item using the official API (3 arguments: streamName, groupId, id)
      const subscription = streamRef.current.subscribeItem<StreamMessage>(streamName, groupId, id)

      subscription.addChangeListener((item: StreamMessage | null) => {
        console.log('📡 Stream item update:', item)
        if (item) {
          callback(item)
        }
      })

      // Store subscription for cleanup
      const key = `${streamName}_${groupId}_${id}`
      subscriptionsRef.current.set(key, subscription)

      console.log('✅ Successfully subscribed to stream item')

      // Return unsubscribe function
      return () => {
        subscription.close()
        subscriptionsRef.current.delete(key)
        console.log('🧹 Unsubscribed from stream item')
      }

    } catch (error) {
      console.error('❌ Failed to subscribe to stream item:', error)
    }
  }

  return {
    isConnected,
    subscribeToStreamItem,
  }
}
