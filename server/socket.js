const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initializeSocket(server) {
    io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel-hub-secret-key-change-in-production-2024');
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                socket.authenticated = true;
                next();
            } catch (err) {
                console.error('Socket auth error:', err.message);
                socket.authenticated = false;
                next(); // Allow connection but mark as unauthenticated
            }
        } else {
            // Allow connection without authentication for general features
            socket.authenticated = false;
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.userId);

        // Join user's personal room for notifications
        socket.join(`user:${socket.userId}`);

        // Join a conversation room
        socket.on('join:conversation', (conversationId) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        });

        // Leave a conversation room
        socket.on('leave:conversation', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`User ${socket.userId} left conversation ${conversationId}`);
        });

        // Typing indicators
        socket.on('typing:start', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('user:typing', {
                userId: socket.userId,
                conversationId
            });
        });

        socket.on('typing:stop', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
                userId: socket.userId,
                conversationId
            });
        });

        // Mark user as online
        socket.on('user:online', () => {
            socket.broadcast.emit('user:status', {
                userId: socket.userId,
                status: 'online'
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.userId);
            socket.broadcast.emit('user:status', {
                userId: socket.userId,
                status: 'offline'
            });
        });
    });

    return io;
}

// Helper function to emit events from outside socket.io handlers
function emitToUser(userId, event, data) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

function emitToConversation(conversationId, event, data) {
    if (io) {
        io.to(`conversation:${conversationId}`).emit(event, data);
    }
}

module.exports = {
    initializeSocket,
    emitToUser,
    emitToConversation,
    getIO: () => io
};
