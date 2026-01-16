// ============================================
// SOCKET SERVICE
// ============================================
// File: utils/socketService.js
// Description: Socket.io service for real-time order updates
// ============================================

let io = null;

// Initialize socket.io
function initializeSocket(server) {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for now (can be restricted in production)
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Handle order room joining
    socket.on('join_order', (orderId) => {
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`[SOCKET] Client ${socket.id} joined room: ${room}`);
    });

    // Handle order room leaving
    socket.on('leave_order', (orderId) => {
      const room = `order_${orderId}`;
      socket.leave(room);
      console.log(`[SOCKET] Client ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[SOCKET] Socket.io server initialized');
  return io;
}

// Emit order update event
function emitOrderUpdate(orderId, orderData) {
  if (!io) {
    console.warn('[SOCKET] Socket.io not initialized');
    return;
  }

  const room = `order_${orderId}`;
  io.to(room).emit('order_updated', {
    order_id: orderId,
    order: orderData,
    timestamp: new Date().toISOString()
  });

  console.log(`[SOCKET] Emitted order_updated to room: ${room}`);
}

// Emit order created event
function emitOrderCreated(orderId, orderData) {
  if (!io) {
    console.warn('[SOCKET] Socket.io not initialized');
    return;
  }

  const room = `order_${orderId}`;
  io.to(room).emit('order_created', {
    order_id: orderId,
    order: orderData,
    timestamp: new Date().toISOString()
  });

  console.log(`[SOCKET] Emitted order_created to room: ${room}`);
}

// Emit order items added event
function emitOrderItemsAdded(orderId, orderData) {
  if (!io) {
    console.warn('[SOCKET] Socket.io not initialized');
    return;
  }

  const room = `order_${orderId}`;
  io.to(room).emit('order_items_added', {
    order_id: orderId,
    order: orderData,
    timestamp: new Date().toISOString()
  });

  console.log(`[SOCKET] Emitted order_items_added to room: ${room}`);
}

// Get socket.io instance
function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  emitOrderUpdate,
  emitOrderCreated,
  emitOrderItemsAdded,
  getIO
};

