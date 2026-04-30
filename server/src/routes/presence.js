const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/:docId', (req, res) => {
  const { docId } = req.params;
  const userId = req.user.id;
  const doc = db.get('documents').find({ id: docId }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const canAccess = doc.ownerId === userId || db.get('shares').find({ documentId: docId, sharedWithId: userId }).value();
  if (!canAccess) return res.status(403).json({ error: 'Access denied' });
  const existing = db.get('presence').find({ docId, userId }).value();
  if (existing) {
    db.get('presence').find({ docId, userId }).assign({ lastSeen: new Date().toISOString() }).write();
  } else {
    db.get('presence').push({ id: uuidv4(), docId, userId, username: req.user.username, lastSeen: new Date().toISOString() }).write();
  }
  res.json({ ok: true });
});

router.get('/:docId', (req, res) => {
  const cutoff = new Date(Date.now() - 30000).toISOString();
  const active = db.get('presence').filter(p => p.docId === req.params.docId && p.lastSeen > cutoff).value();
  res.json(active);
});

router.delete('/:docId', (req, res) => {
  db.get('presence').remove({ docId: req.params.docId, userId: req.user.id }).write();
  res.json({ ok: true });
});

module.exports = router;
