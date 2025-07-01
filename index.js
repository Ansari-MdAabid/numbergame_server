const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (roomId) => {
    rooms[roomId] = [socket.id];
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId] && rooms[roomId].length === 1) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.emit('roomJoined', roomId);
      io.to(roomId).emit('startGame', roomId);
    } else {
      socket.emit('errorRoom', 'Room full or not found');
    }
  });

  socket.on('moveTile', ({ roomId, tiles }) => {
    socket.to(roomId).emit('opponentMove', tiles);
  });

  socket.on('puzzleCompleted', (roomId) => {
    io.to(roomId).emit('gameOver', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [roomId, players] of Object.entries(rooms)) {
      if (players.includes(socket.id)) {
        delete rooms[roomId];
        io.to(roomId).emit('playerLeft');
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('✅ Socket.IO server running on http://localhost:3000');
});
