const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  const userId = req.user.id;
  const owned = db.get('documents').filter({ ownerId: userId }).map(d => ({ ...d, role: 'owner' })).value();
  const sharedEntries = db.get('shares').filter({ sharedWithId: userId }).value();
  const shared = sharedEntries.map(s => {
    const doc = db.get('documents').find({ id: s.documentId }).value();
    if (!doc) return null;
    const owner = db.get('users').find({ id: doc.ownerId }).value();
    return { ...doc, role: 'shared', sharedBy: owner?.username };
  }).filter(Boolean);
  res.json({ owned, shared });
});

router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const doc = { id: uuidv4(), title: title.trim(), content: content || '', ownerId: req.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.get('documents').push(doc).write();
  res.status(201).json(doc);
});

router.get('/:id', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const canAccess = doc.ownerId === req.user.id || db.get('shares').find({ documentId: doc.id, sharedWithId: req.user.id }).value();
  if (!canAccess) return res.status(403).json({ error: 'Access denied' });
  const owner = db.get('users').find({ id: doc.ownerId }).value();
  const shares = db.get('shares').filter({ documentId: doc.id }).value().map(s => {
    const u = db.get('users').find({ id: s.sharedWithId }).value();
    return { userId: s.sharedWithId, username: u?.username };
  });
  res.json({ ...doc, ownerUsername: owner?.username, shares, role: doc.ownerId === req.user.id ? 'owner' : 'shared' });
});

router.patch('/:id', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const canEdit = doc.ownerId === req.user.id || db.get('shares').find({ documentId: doc.id, sharedWithId: req.user.id }).value();
  if (!canEdit) return res.status(403).json({ error: 'Access denied' });
  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title.trim();
  if (req.body.content !== undefined) updates.content = req.body.content;
  updates.updatedAt = new Date().toISOString();
  db.get('documents').find({ id: req.params.id }).assign(updates).write();
  res.json(db.get('documents').find({ id: req.params.id }).value());
});

router.delete('/:id', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete this document' });
  db.get('documents').remove({ id: req.params.id }).write();
  db.get('shares').remove({ documentId: req.params.id }).write();
  db.get('versions').remove({ documentId: req.params.id }).write();
  res.json({ message: 'Document deleted' });
});

router.post('/:id/share', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can share this document' });
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  const targetUser = db.get('users').find({ username }).value();
  if (!targetUser) return res.status(404).json({ error: `User "${username}" not found` });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });
  const existing = db.get('shares').find({ documentId: doc.id, sharedWithId: targetUser.id }).value();
  if (existing) return res.status(409).json({ error: `Already shared with ${username}` });
  const share = { id: uuidv4(), documentId: doc.id, sharedWithId: targetUser.id, createdAt: new Date().toISOString() };
  db.get('shares').push(share).write();
  res.status(201).json({ message: `Shared with ${username}`, share });
});

router.delete('/:id/share/:userId', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can revoke access' });
  db.get('shares').remove({ documentId: req.params.id, sharedWithId: req.params.userId }).write();
  res.json({ message: 'Access revoked' });
});

router.get('/:id/versions', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const canAccess = doc.ownerId === req.user.id || db.get('shares').find({ documentId: doc.id, sharedWithId: req.user.id }).value();
  if (!canAccess) return res.status(403).json({ error: 'Access denied' });
  const versions = db.get('versions').filter({ documentId: doc.id }).sortBy('savedAt').reverse().value();
  res.json(versions);
});

router.post('/:id/versions', (req, res) => {
  const doc = db.get('documents').find({ id: req.params.id }).value();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const canAccess = doc.ownerId === req.user.id || db.get('shares').find({ documentId: doc.id, sharedWithId: req.user.id }).value();
  if (!canAccess) return res.status(403).json({ error: 'Access denied' });
  const version = { id: uuidv4(), documentId: doc.id, content: doc.content, title: doc.title, savedBy: req.user.username, savedAt: new Date().toISOString() };
  db.get('versions').push(version).write();
  res.status(201).json(version);
});

module.exports = router;
