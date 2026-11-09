import { useEffect, useState } from 'react'
import { checkHealth } from '../services/api'

const ATTEMPTS = 10
const RETRY_MS = 6000

export function useBackendStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false
    let timer

    const attempt = (left) => {
      checkHealth()
        .then(() => !cancelled && setStatus('online'))
        .catch(() => {
          if (cancelled) return
          if (left <= 1) setStatus('offline')
          else timer = setTimeout(() => attempt(left - 1), RETRY_MS)
        })
    }

    attempt(ATTEMPTS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return status
}
