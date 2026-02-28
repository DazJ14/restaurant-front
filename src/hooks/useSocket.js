import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(process.env.VITE_SOCKET_URL || 'http://localhost:3000'  , {
      transports: ['websocket'],
      autoConnect: true,
    })
  }
  return socketInstance
}

export function useSocket(eventHandlers = {}) {
  const socket = getSocket()
  const handlersRef = useRef(eventHandlers)
  handlersRef.current = eventHandlers

  useEffect(() => {
    const entries = Object.entries(handlersRef.current)
    const handlers = entries.map(([event, handler]) => {
      const wrapped = (...args) => handler(...args)
      socket.on(event, wrapped)
      return [event, wrapped]
    })
    return () => {
      handlers.forEach(([event, wrapped]) => socket.off(event, wrapped))
    }
  }, [socket])

  return socket
}
