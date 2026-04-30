const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

db.defaults({ users: [], documents: [], shares: [], versions: [], presence: [] }).write();

if (db.get('users').value().length === 0) {
  const users = [
    { id: uuidv4(), username: 'alice', password: bcrypt.hashSync('password123', 10), createdAt: new Date().toISOString() },
    { id: uuidv4(), username: 'bob', password: bcrypt.hashSync('password123', 10), createdAt: new Date().toISOString() },
    { id: uuidv4(), username: 'charlie', password: bcrypt.hashSync('password123', 10), createdAt: new Date().toISOString() },
  ];
  db.get('users').push(...users).write();
  console.log('Seeded 3 test users: alice, bob, charlie (password: password123)');
}

module.exports = db;
