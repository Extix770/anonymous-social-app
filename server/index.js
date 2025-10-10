const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { generateUsername } = require('random-username-generator');

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

// --- Cloudinary & Multer ---
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Stats Tracking ---
const visitsFilePath = path.join(__dirname, 'visits.txt');
const postsFilePath = path.join(__dirname, 'posts.json');
let totalVisits = 0;

const loadVisits = () => {
  if (fs.existsSync(visitsFilePath)) {
    const data = fs.readFileSync(visitsFilePath, 'utf8');
    totalVisits = parseInt(data, 10) || 0;
  }
};

const saveVisits = () => {
  fs.writeFileSync(visitsFilePath, totalVisits.toString(), 'utf8');
};

const loadPosts = () => {
  if (fs.existsSync(postsFilePath)) {
    const data = fs.readFileSync(postsFilePath, 'utf8');
    posts = JSON.parse(data);
    nextId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
  }
};

const savePosts = () => {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), 'utf8');
};

const incrementVisits = (req, res, next) => {
  totalVisits++;
  saveVisits();
  broadcastStats(); // Also broadcast on visit
  next();
};

const broadcastStats = () => {
  io.emit('update-stats', {
    onlineCount: io.engine.clientsCount,
    totalVisits,
  });
};

// --- In-memory stores ---
let posts = [];
let nextId = 1;

// --- REST API Endpoints ---
app.get('/posts', incrementVisits, (req, res) => res.json(posts.sort((a, b) => b.id - a.id)));

app.get('/cybersecurity-news', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const newsFilePath = path.join(__dirname, 'cybersecurity-news.json');
  if (fs.existsSync(newsFilePath)) {
    const data = fs.readFileSync(newsFilePath, 'utf8');
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.get('/github-tools', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const toolsFilePath = path.join(__dirname, 'github-tools.json');
  if (fs.existsSync(toolsFilePath)) {
    const data = fs.readFileSync(toolsFilePath, 'utf8');
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.post('/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
    if (error || !result) return res.status(500).json({ error: 'Failed to upload file.' });
    res.status(201).json({ url: result.secure_url, mediaType: result.resource_type });
  }).end(req.file.buffer);
});

app.post('/posts/:id/react', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji not specified' });

    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!post.reactions[emoji]) {
        post.reactions[emoji] = 0;
    }
    post.reactions[emoji]++;
    savePosts();
    io.emit('new-reaction', { postId, reactions: post.reactions });
    res.status(200).json(post.reactions);
});

// --- Omegle-style Chat Logic ---
let waitingQueue = [];
let partners = {};

const tryPairUsers = () => {
  if (waitingQueue.length < 2) return;
  const user1Id = waitingQueue.shift();
  const user2Id = waitingQueue.shift();
  if (!io.sockets.sockets.has(user1Id) || !io.sockets.sockets.has(user2Id)) {
    if(io.sockets.sockets.has(user1Id)) waitingQueue.unshift(user1Id);
    if(io.sockets.sockets.has(user2Id)) waitingQueue.unshift(user2Id);
    return tryPairUsers();
  }
  partners[user1Id] = user2Id;
  partners[user2Id] = user1Id;
  io.to(user1Id).emit('matched', { partnerId: user2Id, isInitiator: true });
  io.to(user2Id).emit('matched', { partnerId: user1Id, isInitiator: false });
};

const endChat = (socketId) => {
  const partnerId = partners[socketId];
  if (partnerId) {
    io.to(partnerId).emit('partner-left');
    delete partners[socketId];
    delete partners[partnerId];
  }
  waitingQueue = waitingQueue.filter(id => id !== socketId);
};

io.on('connection', (socket) => {
  broadcastStats();

  socket.username = generateUsername();
  socket.emit('username-assigned', socket.username);

  socket.on('create-post', ({ content, mediaUrl, mediaType }) => {
    if (!content && !mediaUrl) return; // Basic validation
    const newPost = {
      id: nextId++,
      username: socket.username,
      content,
      mediaUrl,
      mediaType,
      timestamp: new Date().toISOString(),
      comments: [],
      reactions: {},
    };
    posts.unshift(newPost);
    savePosts();
    io.emit('new-post', newPost);
  });

  socket.on('create-comment', ({ postId, comment }) => {
    if (!comment) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: Date.now(),
      username: socket.username,
      text: comment,
      timestamp: new Date().toISOString(),
    };
    post.comments.push(newComment);
    savePosts();
    io.emit('new-comment', { postId, comment: newComment });
  });

  socket.on('find-partner', () => {
    endChat(socket.id);
    if (!waitingQueue.includes(socket.id)) waitingQueue.push(socket.id);
    tryPairUsers();
  });

  socket.on('next-partner', () => {
    endChat(socket.id);
    if (!waitingQueue.includes(socket.id)) waitingQueue.push(socket.id);
    tryPairUsers();
  });

  socket.on('webrtc-signal', (payload) => {
    const partnerId = partners[socket.id];
    if (partnerId) io.to(partnerId).emit('webrtc-signal', payload);
  });

  socket.on('disconnect', () => {
    endChat(socket.id);
    broadcastStats();
  });
});

// --- Start Server ---
server.listen(port, () => {
  loadVisits();
  loadPosts();
  console.log(`Server listening at http://localhost:${port}`);
});