
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory store for posts
let posts = [];
let nextId = 1;

// GET /posts - Retrieve all posts
app.get('/posts', (req, res) => {
  res.json(posts.sort((a, b) => b.id - a.id));
});

// POST /posts - Create a new post
app.post('/posts', (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }

  const newPost = {
    id: nextId++,
    content,
    timestamp: new Date().toISOString(),
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
