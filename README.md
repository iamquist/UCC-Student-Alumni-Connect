# UniAlum - Alumni-Student Networking Platform

A full-stack production-ready platform connecting alumni with students for mentorship, networking, and career development.

## 🏗️ Architecture

```
unialum/
├── frontend/          # Vite + React + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + GraphQL + Socket.io + MongoDB
└── docker-compose.yml # MongoDB + Redis infrastructure
```

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (Sora + DM Sans fonts)
- **State**: Zustand (auth, chat, notifications)
- **Real-time**: Socket.io client
- **GraphQL**: Apollo Client
- **Routing**: React Router v6
- **Testing**: Vitest + Testing Library

### Backend
- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM) via Docker
- **Real-time**: Socket.io
- **GraphQL**: Apollo Server v4
- **Auth**: JWT (access + refresh tokens)
- **Queues**: Bull (notification delivery)
- **Testing**: Jest + Supertest + mongodb-memory-server
- **Cache**: Redis

## 🐳 Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d
```
This starts MongoDB (port 27017), Redis (port 6379), and Mongo Express UI (port 8081).

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
npm install
npm run seed      # Seed sample data
npm run dev       # Start development server (port 5000)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Start dev server (port 3000)
```

### 4. Access the app
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **GraphQL Playground**: http://localhost:5000/graphql
- **Mongo Express**: http://localhost:8081

## 🔑 Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@unialum.com | Admin@123456 |
| Alumni | arjun@example.com | Password@123 |
| Student | darlene@example.com | Password@123 |

## 🧪 Running Tests

### Backend
```bash
cd backend
npm test                 # Run all tests
npm run test:coverage    # With coverage report
```

### Frontend
```bash
cd frontend
npm test                 # Run all tests
npm run test:coverage    # With coverage report
```

## 📡 Real-Time Features

### Socket.io Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client → Server | Send a chat message |
| `message:new` | Server → Client | Receive a new message |
| `message:read` | Bidirectional | Mark messages as read |
| `typing:start` | Client → Server | User started typing |
| `typing:stop` | Client → Server | User stopped typing |
| `notification:new` | Server → Client | New notification |
| `user:online` | Server → Client | User came online |
| `user:offline` | Server → Client | User went offline |
| `conversation:join` | Client → Server | Join a conversation room |

## 🔒 Security Features

- JWT access tokens (7d) + refresh tokens (30d)
- bcrypt password hashing (12 rounds)
- Rate limiting per endpoint type
- Helmet.js security headers
- CORS with whitelist
- MongoDB NoSQL injection sanitization
- Role-based access control (student / alumni / admin)
- Input validation and sanitization
- File type/size validation on uploads

## 🗄️ Database Models

| Model | Description |
|-------|-------------|
| User | Core user entity |
| StudentProfile | Student-specific data |
| AlumniProfile | Alumni-specific data |
| Post | Feed posts with likes/comments |
| Conversation | Chat conversation |
| Message | Individual chat message |
| Connection | User connections/network |
| Notification | In-app notifications |
| JobOpportunity | Job listings |
| Event | Platform events |
| MentorshipRequest | Student-alumni mentorship |
| StudentQuestion | Q&A between students and alumni |
| Skill | User skills with progress |
| ActivityLog | Audit trail |
| ContentModeration | Content reports |
| SavedSearch | Saved job/user searches |
| Setting | System configuration |

## 📱 Frontend Pages

| Page | Route | Features |
|------|-------|---------|
| Feed | `/feed` | Posts, likes, comments, create post |
| Profile | `/profile/:id` | User info, projects, experience, edit |
| Network | `/network` | Connections, invitations, teammates |
| Jobs | `/jobs` | Job listings, apply, save, search |
| Chat | `/chat` | Real-time messaging, typing indicators |
| Events | `/events` | Browse and register for events |
| Notifications | `/notifications` | Notification feed with dashboard |
| Admin | `/admin` | Dashboard, users, activity logs |
| Login | `/login` | JWT authentication |
| Register | `/register` | Student/alumni registration |

## 🏭 Production Deployment

### Environment Variables (backend)
Set all variables from `.env.example` with production values:
- Use strong JWT secrets (32+ chars)
- Configure SMTP for email
- Set `NODE_ENV=production`
- Use MongoDB Atlas or production Docker setup

### Build Frontend
```bash
cd frontend && npm run build
# Serve dist/ with nginx or CDN
```

## 📊 API Reference

All REST endpoints are prefixed with `/api/v1`.

### Auth
- `POST /auth/register` — Create account
- `POST /auth/login` — Login
- `GET /auth/me` — Current user (requires auth)
- `PUT /auth/change-password` — Change password
- `POST /auth/forgot-password` — Request reset
- `POST /auth/reset-password` — Reset with token

### Feed
- `GET /posts` — Get paginated posts
- `POST /posts` — Create post
- `POST /posts/:id/like` — Toggle like
- `POST /posts/:id/comment` — Add comment
- `DELETE /posts/:id` — Delete post

### Chat
- `GET /messages/conversations` — List conversations
- `POST /messages/conversations` — Start conversation
- `GET /messages/conversations/:id/messages` — Get messages
- `POST /messages` — Send message (also via socket)
- `PUT /messages/conversations/:id/read` — Mark as read

### Admin (requires admin role)
- `GET /admin/dashboard` — Stats overview
- `GET /admin/users` — List all users
- `PUT /admin/users/:id/status` — Activate/deactivate
- `GET /admin/activity-logs` — Audit logs
