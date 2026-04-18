// server.js — Main entry point with Express + Socket.io
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/error');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── Socket.io Real-time Logic ───────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins — mark online
  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${userId} is online`);

    // Broadcast online status to all
    io.emit('user:online', { userId, isOnline: true });
  });

  // Send a direct message
  socket.on('message:send', (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      // Deliver to receiver if online
      io.to(receiverSocketId).emit('message:receive', message);
    }

    // Also echo back to sender for confirmation
    socket.emit('message:sent', message);
  });

  // Typing indicator
  socket.on('typing:start', ({ receiverId, senderId, senderName }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', { senderId, senderName });
    }
  });

  socket.on('typing:stop', ({ receiverId, senderId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', { senderId });
    }
  });

  // Notify nearby users of a new request
  socket.on('request:new', (requestData) => {
    // Broadcast to all connected users (frontend will filter by location)
    socket.broadcast.emit('request:notification', {
      type: 'new_request',
      request: requestData,
      message: `New ${requestData.urgency === 'urgent' ? '🔴 URGENT' : ''} request: ${requestData.title}`,
    });
  });

  // Disconnect — mark offline
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user:online', { userId: socket.userId, isOnline: false });
      console.log(`👤 User ${socket.userId} went offline`);
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
