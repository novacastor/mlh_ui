import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getLearningStreamUrl } from '../lib/api/client'
import { learningKeys } from '../lib/queryKeys'

const ENABLE_WS = import.meta.env.VITE_ENABLE_WS !== 'false'

/**
 * Subscribes to the learning WebSocket and invalidates session queries on updates.
 */
export function useSessionStream(sessionId: string | undefined, token: string | null) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!ENABLE_WS || !sessionId || !token) return

    const url = getLearningStreamUrl(sessionId, token)
    const ws = new WebSocket(url)
    wsRef.current = ws

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: learningKeys.session(sessionId) })
    }

    ws.onmessage = () => {
      invalidate()
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.onmessage = null
      ws.close()
      wsRef.current = null
    }
  }, [queryClient, sessionId, token])
}
