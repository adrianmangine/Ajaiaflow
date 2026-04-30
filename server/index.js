require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/documents', require('./src/routes/documents'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/presence', require('./src/routes/presence'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Internal server error' }); });

const PORT = process.env.PORT || 3001;
if (require.main === module) app.listen(PORT, () => console.log(`AjaiaFlow API running on http://localhost:${PORT}`));
module.exports = app;
