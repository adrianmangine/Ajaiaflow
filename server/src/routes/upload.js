const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('../db');
const auth = require('../middleware/auth');

const ALLOWED_TYPES = ['.txt', '.md'];
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ALLOWED_TYPES.includes(ext) ? cb(null, true) : cb(new Error('Unsupported file type. Accepted: .txt, .md'));
  },
});

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const text = req.file.buffer.toString('utf-8');
  const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
  const title = req.body.title || originalName || 'Imported Document';
  const ext = path.extname(req.file.originalname).toLowerCase();
  let content;
  if (ext === '.md') {
    content = text.split('\n').map(line => {
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.trim() === '') return '';
      return `<p>${line}</p>`;
    }).filter(l => l !== '').join('');
  } else {
    content = text.split(/\n\n+/).map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
  }
  const doc = { id: uuidv4(), title: title.trim(), content, ownerId: req.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.get('documents').push(doc).write();
  res.status(201).json({ message: 'File imported successfully', document: doc });
});

router.use((err, req, res, next) => { if (err.message) return res.status(400).json({ error: err.message }); next(err); });
module.exports = router;
