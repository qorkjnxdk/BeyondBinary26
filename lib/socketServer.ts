import { Server as SocketIOServer } from 'socket.io';

declare global {
  var _io: SocketIOServer | undefined;
}

export function setIO(io: SocketIOServer): void {
  globalThis._io = io;
}

export function getIO(): SocketIOServer | null {
  return globalThis._io || null;
}
