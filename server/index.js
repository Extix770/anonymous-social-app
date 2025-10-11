const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const rug = require('random-username-generator');

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
const usersFilePath = path.join(__dirname, 'users.json');
const messagesFilePath = path.join(__dirname, 'messages.json');
const notificationsFilePath = path.join(__dirname, 'notifications.json');
let totalVisits = 0;
let users = [];
let messages = [];
let notifications = [];

const loadVisits = () => {
  if (fs.existsSync(visitsFilePath)) {
    const data = fs.readFileSync(visitsFilePath, 'utf8');
    totalVisits = parseInt(data, 10) || 0;
  }
};

const saveVisits = () => {
  fs.writeFileSync(visitsFilePath, totalVisits.toString(), 'utf8');
};

const loadUsers = () => {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    users = JSON.parse(data);
  }
};

const saveUsers = () => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
};

const loadMessages = () => {
  if (fs.existsSync(messagesFilePath)) {
    const data = fs.readFileSync(messagesFilePath, 'utf8');
    messages = JSON.parse(data);
  }
};

const saveMessages = () => {
  fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');
};

const loadNotifications = () => {
  if (fs.existsSync(notificationsFilePath)) {
    const data = fs.readFileSync(notificationsFilePath, 'utf8');
    notifications = JSON.parse(data);
  }
};

const saveNotifications = () => {
  fs.writeFileSync(notificationsFilePath, JSON.stringify(notifications, null, 2), 'utf8');
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
app.get('/posts', incrementVisits, (req, res) => {
  const category = req.query.category;
  let filteredPosts = posts;
  if (category) {
    filteredPosts = posts.filter(p => p.category === category);
  }
  res.json(filteredPosts.sort((a, b) => b.id - a.id));
});

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

app.get('/api/users/:userId', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/users/:userId', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { bio, avatar } = req.body;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;

  saveUsers();
  res.json(user);
});

app.get('/api/search', (req, res) => {
  const query = req.query.q.toLowerCase();
  if (!query) return res.json(posts);

  const results = posts.filter(post => {
    const postContent = post.content.toLowerCase();
    const hasMatchingComment = post.comments.some(comment => comment.text.toLowerCase().includes(query));
    return postContent.includes(query) || hasMatchingComment;
  });

  res.json(results);
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

const userSockets = {};

io.on('connection', (socket) => {
  broadcastStats();

  let user = null;
  const userId = socket.handshake.query.userId;

  if (userId) {
    user = users.find(u => u.id === userId);
  }

  if (!user) {
    user = {
      id: Date.now().toString(),
      username: rug.generate(),
      bio: '',
      avatar: 'https://i.pravatar.cc/150?u=' + Date.now().toString(), // Placeholder avatar
    };
    users.push(user);
    saveUsers();
    socket.emit('user-created', user);
  }

  socket.username = user.username;
  socket.userId = user.id;
  userSockets[user.id] = socket.id;

  socket.emit('username-assigned', socket.username);

  socket.on('create-post', ({ content, mediaUrl, mediaType, category, poll }) => {
    if (!content && !mediaUrl && !poll) return; // Basic validation
    const newPost = {
      id: nextId++,
      username: socket.username,
      userId: socket.userId,
      content,
      mediaUrl,
      mediaType,
      category,
      poll,
      timestamp: new Date().toISOString(),
      comments: [],
      upvotes: 0,
      downvotes: 0,
    };
    posts.unshift(newPost);
    savePosts();
    io.emit('new-post', newPost);
  });

  socket.on('upvote-post', ({ postId }) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.upvotes++;
      savePosts();
      io.emit('post-voted', { postId, upvotes: post.upvotes, downvotes: post.downvotes });
    }
  });

  socket.on('downvote-post', ({ postId }) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.downvotes++;
      savePosts();
      io.emit('post-voted', { postId, upvotes: post.upvotes, downvotes: post.downvotes });
    }
  });

  socket.on('vote-on-poll', ({ postId, optionIndex }) => {
    const post = posts.find(p => p.id === postId);
    if (post && post.poll && post.poll.options[optionIndex]) {
      post.poll.options[optionIndex].votes++;
      savePosts();
      io.emit('poll-voted', { postId, poll: post.poll });
    }
  });

  socket.on('create-comment', ({ postId, comment }) => {
    if (!comment) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: Date.now(),
      username: socket.username,
      userId: socket.userId,
      text: comment,
      timestamp: new Date().toISOString(),
    };
    post.comments.push(newComment);
    savePosts();
    io.emit('new-comment', { postId, comment: newComment });

    // Create a notification for the post author
    if (post.userId !== socket.userId) {
      const notification = {
        id: Date.now().toString(),
        userId: post.userId,
        type: 'new-comment',
        postId,
        commentId: newComment.id,
        fromUser: socket.username,
        read: false,
      };
      notifications.push(notification);
      saveNotifications();

      const toSocketId = userSockets[post.userId];
      if (toSocketId) {
        io.to(toSocketId).emit('new-notification', notification);
      }
    }
  });

  socket.on('get-notifications', () => {
    const userNotifications = notifications.filter(n => n.userId === socket.userId);
    socket.emit('notifications', userNotifications);
  });

  socket.on('mark-notification-as-read', ({ notificationId }) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      saveNotifications();
    }
  });

  socket.on('get-private-messages', ({ withUserId }) => {
    const userMessages = messages.filter(
      (msg) =>
        (msg.from === socket.userId && msg.to === withUserId) ||
        (msg.from === withUserId && msg.to === socket.userId)
    );
    socket.emit('private-messages', userMessages);
  });

  socket.on('private-message', ({ to, text }) => {
    const message = {
      from: socket.userId,
      to,
      text,
      timestamp: new Date().toISOString(),
    };
    messages.push(message);
    saveMessages();

    const toSocketId = userSockets[to];
    if (toSocketId) {
      io.to(toSocketId).emit('private-message', message);
    }
    socket.emit('private-message', message);
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
    delete userSockets[socket.userId];
    endChat(socket.id);
    broadcastStats();
  });
});

// --- Start Server ---
server.listen(port, () => {
  loadVisits();
  loadPosts();
  loadUsers();
  loadMessages();
  loadNotifications();
  console.log(`Server listening at http://localhost:${port}`);
});