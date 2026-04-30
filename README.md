# AjaiaFlow

A lightweight collaborative document editor.

## Live Demo
**URL:** https://ajaiaflow.vercel.app

**Test accounts** (password: `password123`):
- `alice` — primary user
- `bob` — for testing sharing
- `charlie` — additional collaborator

## Features
- Rich text editing (bold, italic, underline, headings, lists, alignment)
- Text colors and font selection
- Auto-save
- File import (.txt and .md)
- Document sharing by username with access revocation
- Session-based version history with restore
- Real-time presence indicators
- Persistent storage

## Local Setup
```bash
# Terminal 1 - Server
cd server && npm install && node index.js

# Terminal 2 - Client  
cd client && npm install && npm run dev
```

Open http://localhost:5173

## Tech Stack
- Frontend: React + Vite + Tiptap
- Backend: Node + Express
- Database: lowdb (JSON flat file)
- Auth: JWT + bcrypt
- Deployment: Vercel (frontend) + Railway (backend)
