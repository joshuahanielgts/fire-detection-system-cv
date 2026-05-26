import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
})

export const connectSocket = () => {
  if (!socket.connected) socket.connect()
}

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect()
}

export const onFireDetected = (callback) => {
  socket.on('fireDetected', callback)
}

export const offFireDetected = () => {
  socket.off('fireDetected')
}
