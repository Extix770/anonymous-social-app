const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3001; // Use Render's port

// --- Config --- 
app.use(cors());
app.use(express.json());

// --- Cloudinary Config --- 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Multer Config (for file uploads) ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- In-memory store for posts ---
let posts = [];
let nextId = 1;

// --- API Endpoints ---

// GET /posts - Retrieve all posts
app.get('/posts', (req, res) => {
  res.json(posts.sort((a, b) => b.id - a.id));
});

// POST /upload - Upload a file to Cloudinary
app.post('/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Send file to Cloudinary
  cloudinary.uploader.upload_stream(
    {
      resource_type: 'auto', // Automatically detect image or video
    },
    (error, result) => {
      if (error || !result) {
        console.error('Cloudinary Error:', error);
        return res.status(500).json({ error: 'Failed to upload file.' });
      }
      res.status(201).json({ 
        url: result.secure_url,
        mediaType: result.resource_type
      });
    }
  ).end(req.file.buffer);
});

// POST /posts - Create a new post
app.post('/posts', (req, res) => {
  const { content, mediaUrl, mediaType } = req.body;

  // A post must have either content or media
  if (!content && !mediaUrl) {
    return res.status(400).json({ error: 'Post cannot be empty' });
  }

  const newPost = {
    id: nextId++,
    content,
    mediaUrl, // can be null
    mediaType, // can be null
    timestamp: new Date().toISOString(),
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});