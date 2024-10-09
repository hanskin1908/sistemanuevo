import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    createTables();
  }
});

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    grado INTEGER NOT NULL,
    grupo TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER,
    materia TEXT NOT NULL,
    nota REAL NOT NULL,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id)
  )`);
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

app.get('/api/estudiantes/:id/notas', (req, res) => {
  const { id } = req.params;
  db.all('SELECT materia, nota FROM notas WHERE estudiante_id = ?', [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Socket.io
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', ({ roomId, userId }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    io.to(roomId).emit('message', message);
  });

  socket.on('disconnect', () => {
    rooms.forEach((users, roomId) => {
      users.forEach((userId) => {
        if (socket.rooms.has(roomId)) {
          users.delete(userId);
          console.log(`User ${userId} left room ${roomId}`);
          if (users.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});