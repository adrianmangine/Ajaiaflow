process.env.DB_PATH = '/tmp/test-db-ajaiaflow.json';
process.env.JWT_SECRET = 'test-secret';
const request = require('supertest');
const app = require('../index');
const fs = require('fs');

afterAll(() => { try { fs.unlinkSync('/tmp/test-db-ajaiaflow.json'); } catch {} });

describe('Auth', () => {
  test('returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
  test('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('Documents', () => {
  let tokenAlice, tokenBob, docId;
  beforeAll(async () => {
    const a = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'password123' });
    tokenAlice = a.body.token;
    const b = await request(app).post('/api/auth/login').send({ username: 'bob', password: 'password123' });
    tokenBob = b.body.token;
  });
  test('creates a document', async () => {
    const res = await request(app).post('/api/documents').set('Authorization', `Bearer ${tokenAlice}`).send({ title: 'Test', content: '<p>hi</p>' });
    expect(res.status).toBe(201);
    docId = res.body.id;
  });
  test('returns owned documents', async () => {
    const res = await request(app).get('/api/documents').set('Authorization', `Bearer ${tokenAlice}`);
    expect(res.body.owned.length).toBeGreaterThan(0);
  });
  test('updates document title', async () => {
    const res = await request(app).patch(`/api/documents/${docId}`).set('Authorization', `Bearer ${tokenAlice}`).send({ title: 'Renamed' });
    expect(res.body.title).toBe('Renamed');
  });
  test('blocks unauthorized user', async () => {
    const res = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${tokenBob}`);
    expect(res.status).toBe(403);
  });
  test('shares document with bob', async () => {
    const res = await request(app).post(`/api/documents/${docId}/share`).set('Authorization', `Bearer ${tokenAlice}`).send({ username: 'bob' });
    expect(res.status).toBe(201);
  });
  test('bob can access shared document', async () => {
    const res = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${tokenBob}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('shared');
  });
  test('only owner can delete', async () => {
    const res = await request(app).delete(`/api/documents/${docId}`).set('Authorization', `Bearer ${tokenBob}`);
    expect(res.status).toBe(403);
  });
});
