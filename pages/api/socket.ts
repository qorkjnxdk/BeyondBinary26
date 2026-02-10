import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { verifyToken } from '@/lib/auth';
import { setIO } from '@/lib/socketServer';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

interface SocketWithServer extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithServer;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.data.userId = decoded.userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    // Auto-join personal notification room
    socket.join(`user:${userId}`);

    // Chat session events
    socket.on('join-session', (sessionId: string) => {
      socket.join(sessionId);
    });

    socket.on('leave-session', (sessionId: string) => {
      socket.leave(sessionId);
    });

    socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
      socket.to(data.sessionId).emit('typing', {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by Socket.IO
    });
  });

  res.socket.server.io = io;
  setIO(io);

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
