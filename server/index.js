const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

// --- Main Config ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
  next();
});

// --- Socket.io Config ---
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// --- Cloudinary, Multer, Posts (unchanged) ---
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const storage = multer.memoryStorage();
const upload = multer({ storage });
let posts = [];
let nextId = 1;
app.get('/posts', (req, res) => res.json(posts.sort((a, b) => b.id - a.id)));
app.post('/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
    if (error || !result) return res.status(500).json({ error: 'Failed to upload file.' });
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

// --- Omegle-style Chat Logic ---
let waitingQueue = [];
let partners = {}; // maps user1 -> user2 and user2 -> user1

const tryPairUsers = () => {
  if (waitingQueue.length < 2) return;

  const user1Id = waitingQueue.shift();
  const user2Id = waitingQueue.shift();

  // Ensure users are still connected
  if (!io.sockets.sockets.has(user1Id) || !io.sockets.sockets.has(user2Id)) {
    if(io.sockets.sockets.has(user1Id)) waitingQueue.unshift(user1Id);
    if(io.sockets.sockets.has(user2Id)) waitingQueue.unshift(user2Id);
    return tryPairUsers(); // Try again if a user disconnected while in queue
  }

  partners[user1Id] = user2Id;
  partners[user2Id] = user1Id;

  console.log(`Paired ${user1Id} and ${user2Id}`);
  io.to(user1Id).emit('matched', { partnerId: user2Id, isInitiator: true });
  io.to(user2Id).emit('matched', { partnerId: user1Id, isInitiator: false });
};

const endChat = (socketId) => {
  const partnerId = partners[socketId];
  if (partnerId) {
    console.log(`Ending chat between ${socketId} and ${partnerId}`);
    io.to(partnerId).emit('partner-left');
    delete partners[socketId];
    delete partners[partnerId];
  }
  // Remove from queue if they were waiting
  waitingQueue = waitingQueue.filter(id => id !== socketId);
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('find-partner', () => {
    console.log(`User ${socket.id} is looking for a partner.`);
    endChat(socket.id); // End any existing chat
    if (!waitingQueue.includes(socket.id)) {
        waitingQueue.push(socket.id);
    }
    tryPairUsers();
  });

  socket.on('next-partner', () => {
    console.log(`User ${socket.id} requested next partner.`);
    endChat(socket.id);
    if (!waitingQueue.includes(socket.id)) {
        waitingQueue.push(socket.id);
    }
    tryPairUsers();
  });

  // Relay WebRTC signals to the specific partner
  socket.on('webrtc-signal', (payload) => {
    const partnerId = partners[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('webrtc-signal', payload);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    endChat(socket.id);
  });
});

// --- Start Server ---
server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});