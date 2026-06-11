import { Server } from 'socket.io';

let io = null;

export const initSocket = (server, corsOrigin) => {
  io = new Server(server, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Client passes token or userId on connection query
    const userId = socket.handshake.query.userId;
    const role = socket.handshake.query.role;

    if (userId) {
      socket.join(userId);
      console.log(`🔌 Socket connected: User ${userId} joined room ${userId}`);
    }

    if (role === 'Admin') {
      socket.join('admins');
      console.log(`🔌 Socket connected: Admin joined room 'admins'`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

export const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admins').emit(event, data);
  }
};

export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
