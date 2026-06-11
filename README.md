# AI Chat Assistant SaaS

A production-ready AI Chat Assistant similar to ChatGPT and Claude, built with React, FastAPI, PostgreSQL, and OpenRouter.

## Features

- JWT authentication with refresh tokens
- Real-time streaming AI responses via SSE
- Multiple AI model selection (OpenRouter)
- Chat history with search, rename, and delete
- Dashboard with usage statistics
- Dark/light theme with glassmorphism UI
- Rate limiting, input sanitization, and CORS protection

## Tech Stack

| Layer    | Technologies |
|----------|-------------|
| Frontend | React, TypeScript, Tailwind CSS, Framer Motion, Vite |
| Backend  | FastAPI, SQLAlchemy, PostgreSQL, LangChain |
| AI       | OpenRouter API (GPT-4o Mini default) |

## Project Structure

```
├── frontend/          # React + TypeScript SPA
├── backend/           # FastAPI API server
├── docker-compose.yml # Local PostgreSQL
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (for PostgreSQL) or a local PostgreSQL instance
- OpenRouter API key ([openrouter.ai](https://openrouter.ai))

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://aichat:aichat_secret@localhost:5432/ai_chat_db
JWT_SECRET_KEY=your-local-dev-secret-key
OPENROUTER_API_KEY=your-openrouter-api-key
CORS_ORIGINS=http://localhost:5173
```

Run migrations (optional — tables are auto-created on startup):

```bash
alembic upgrade head
```

Start the API server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173

### Development in Cursor IDE

1. Open the project root folder in Cursor
2. Use two terminals: one for backend (`uvicorn`), one for frontend (`npm run dev`)
3. The Vite dev server proxies `/api` to `localhost:8000` if `VITE_API_URL` is not set

---

## Deployment

### Deploy Backend to Render

1. Push the repository to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your repo — Render reads `backend/render.yaml`
4. Or manually create:
   - **PostgreSQL** database → copy the **Internal Database URL**
   - **Web Service** → Python → Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string from Render |
| `JWT_SECRET_KEY` | Strong random secret |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `APP_ENV` | `production` |
| `CORS_ORIGINS` | Your Vercel frontend URL (e.g. `https://your-app.vercel.app`) |

6. Deploy and note the service URL (e.g. `https://ai-chat-backend.onrender.com`)

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

8. Deploy
9. Update Render `CORS_ORIGINS` with your Vercel URL and redeploy the backend

### Production Checklist

- [ ] Strong `JWT_SECRET_KEY` (32+ random characters)
- [ ] `APP_ENV=production` on backend
- [ ] `CORS_ORIGINS` set to exact frontend URL(s)
- [ ] OpenRouter API key with sufficient credits
- [ ] PostgreSQL backups enabled on Render
- [ ] HTTPS enforced (automatic on Vercel and Render)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (revoke refresh token) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/chat/send` | Send message (SSE stream) |
| GET | `/api/chat/history` | List conversations |
| GET | `/api/chat/{id}` | Get chat with messages |
| POST | `/api/chat/create` | Create new chat |
| PUT | `/api/chat/rename/{id}` | Rename chat |
| DELETE | `/api/chat/delete/{id}` | Delete chat |
| GET | `/api/chat/models/list` | Available AI models |
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/stats` | Usage statistics |
| GET | `/health` | Health check |

---

## Environment Variables Reference

### Backend (`backend/.env`)

```env
DATABASE_URL=
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_MODEL=openai/gpt-4o-mini
APP_NAME=AI Chat Assistant
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
RATE_LIMIT_PER_MINUTE=60
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## License

MIT
