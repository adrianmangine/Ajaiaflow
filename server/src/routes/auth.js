const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'docflow-dev-secret';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  const user = db.get('users').find({ username }).value();
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.get('/users', require('../middleware/auth'), (req, res) => {
  const users = db.get('users').value().filter(u => u.id !== req.user.id).map(u => ({ id: u.id, username: u.username }));
  res.json(users);
});

module.exports = router;
