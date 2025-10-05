
const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

// --- Main Config ---
app.use(cors());
app.use(express.json());

// --- Socket.io Config ---
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity
    methods: ['GET', 'POST'],
  },
});

// --- Cloudinary Config ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Multer Config ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- In-memory stores ---
let posts = [];
let nextId = 1;
const voiceChatRoom = 'global_voice_chat';
let usersInVoice = {}; // Store socket.id -> user info

// --- REST API Endpoints ---
app.get('/posts', (req, res) => res.json(posts.sort((a, b) => b.id - a.id)));

app.post('/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
    if (error || !result) {
      console.error('Cloudinary Error:', error);
      return res.status(500).json({ error: 'Failed to upload file.' });
    }
    res.status(201).json({ url: result.secure_url, mediaType: result.resource_type });
  }).end(req.file.buffer);
});

app.post('/posts', (req, res) => {
  const { content, mediaUrl, mediaType } = req.body;
  if (!content && !mediaUrl) return res.status(400).json({ error: 'Post cannot be empty' });
  const newPost = { id: nextId++, content, mediaUrl, mediaType, timestamp: new Date().toISOString() };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// --- WebSocket (Signaling) Logic ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-voice-chat', () => {
    socket.join(voiceChatRoom);
    usersInVoice[socket.id] = { id: socket.id };
    // Announce new user to others in the room
    socket.to(voiceChatRoom).emit('user-joined', { newUserId: socket.id });
    // Send existing users to the new user
    socket.emit('existing-users', { userIds: Object.keys(usersInVoice).filter(id => id !== socket.id) });
  });

  // Relay WebRTC offers
  socket.on('webrtc-offer', ({ to, offer }) => {
    socket.to(to).emit('webrtc-offer', { from: socket.id, offer });
  });

  // Relay WebRTC answers
  socket.on('webrtc-answer', ({ to, answer }) => {
    socket.to(to).emit('webrtc-answer', { from: socket.id, answer });
  });

  // Relay ICE candidates
  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete usersInVoice[socket.id];
    io.to(voiceChatRoom).emit('user-left', { userId: socket.id });
  });
});

// --- Start Server ---
server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
