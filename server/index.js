const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Server } = require('socket.io');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { fetchNews } = require('./fetch-news');

const app = express();

// --- Main Config ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
  next();
});

// In-memory stores
let posts = [];
let nextId = 1;

// --- Data Persistence ---
const visitsFilePath = path.join(__dirname, 'visits.txt');
const postsFilePath = path.join(__dirname, 'posts.json');

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

// Load initial data
loadVisits();
loadPosts();

// --- API Endpoints ---
app.get('/api/posts', (req, res) => res.json(posts.sort((a, b) => b.id - a.id)));

app.get('/api/cybersecurity-news', (req, res) => {
  const newsFilePath = path.join(__dirname, 'cybersecurity-news.json');
  if (fs.existsSync(newsFilePath)) {
    const data = fs.readFileSync(newsFilePath, 'utf8');
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.post('/api/upload', multer({ storage: multer.memoryStorage() }).single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
    if (error || !result) return res.status(500).json({ error: 'Failed to upload file.' });
    res.status(201).json({ url: result.secure_url, mediaType: result.resource_type });
  }).end(req.file.buffer);
});

app.post('/api/posts', (req, res) => {
  const { content, mediaUrl, mediaType } = req.body;
  if (!content && !mediaUrl) return res.status(400).json({ error: 'Post cannot be empty' });
  const newPost = { id: nextId++, content, mediaUrl, mediaType, timestamp: new Date().toISOString() };
  posts.push(newPost);
  savePosts();
  // WebSocket logic will be handled separately
  res.status(201).json(newPost);
});

app.get('/api/cron/fetch-news', async (req, res) => {
  await fetchNews();
  res.status(200).send('OK');
});

module.exports = app;