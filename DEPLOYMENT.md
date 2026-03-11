# Cloudflare Pages Deployment Guide

This project is configured to deploy on **Cloudflare Pages** with **D1 Database** and **Cloudflare Functions** (Workers) for the API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Static Assets (dist folder)               │   │
│  │  - React App (Vite build)                           │   │
│  │  - index.html, JS, CSS, images                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Cloudflare Functions                      │   │
│  │  ├─ /api/formations      (list, create)            │   │
│  │  ├─ /api/formations/check (check exists)           │   │
│  │  └─ /api/formations/:id   (get single)             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              D1 Database (SQLite)                   │   │
│  │  ├─ formations table                               │   │
│  │  ├─ idx_formations_timestamp                       │   │
│  │  └─ idx_formations_name                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally:
   ```bash
   npm install -g wrangler
   ```
3. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

## Setup

### 1. Create D1 Database (if not exists)

```bash
wrangler d1 create particles
```

Update `wrangler.toml` with the database ID from the output:
```toml
[[d1_databases]]
binding = "DB"
database_name = "particles"
database_id = "your-database-id-here"
```

### 2. Run Migrations

Local development:
```bash
npm run db:migrate
```

Production:
```bash
npm run db:migrate:prod
```

### 3. Configure Environment Variables

Set secrets via Wrangler (for production):
```bash
wrangler pages secret put TURNSTILE_SECRET_KEY --env production
```

Or via Cloudflare Dashboard:
- Go to **Workers & Pages** > **Your Project** > **Settings** > **Environment Variables**

Required variables:
- `TURNSTILE_SECRET_KEY` - For CAPTCHA verification (optional)

Frontend env variables (set in `.env` file or via dashboard):
- `VITE_TURNSTILE_SITE_KEY` - For Turnstile widget

## Development

### Local Development

1. Start the Vite dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, start the Pages dev server with D1:
   ```bash
   npm run pages:dev
   ```

### Build and Preview Locally

```bash
npm run build
npm run pages:dev
```

## Deployment

### Deploy to Cloudflare Pages

1. **Via Wrangler CLI:**
   ```bash
   npm run build
   npm run pages:deploy
   ```

2. **Via Git Integration (Recommended):**
   - Connect your GitHub/GitLab repository in Cloudflare Dashboard
   - Set build command: `npm run build`
   - Set build output directory: `dist`
   - Add environment variables in dashboard

### First-Time Setup

1. Create a new Pages project:
   ```bash
   wrangler pages project create particle-architect
   ```

2. Deploy:
   ```bash
   npm run pages:deploy
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/formations` | List all formations (with pagination) |
| POST | `/api/formations` | Create new formation |
| GET | `/api/formations/check?name=XYZ` | Check if formation name exists |
| GET | `/api/formations/:id` | Get formation by ID |

### Query Parameters (GET /api/formations)

- `search` - Filter by name (case insensitive)
- `offset` - Pagination offset (default: 0)
- `limit` - Results per page (default: 20, max: 50)

## Database Schema

```sql
CREATE TABLE formations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  publisher TEXT NOT NULL,
  ip TEXT,
  timestamp INTEGER NOT NULL
);
```

## Troubleshooting

### D1 Database Not Found

Ensure the database ID in `wrangler.toml` matches your created database:
```bash
wrangler d1 list
```

### Functions Not Working

Check that the `functions` directory is at the project root and properly structured:
```
functions/
└── api/
    ├── formations.ts
    ├── formations/
    │   ├── check.ts
    │   └── [[id]].ts
```

### CORS Errors

The Functions include CORS headers by default. If you see CORS errors:
1. Check browser console for specific error
2. Verify `Access-Control-Allow-Origin` header is present in responses

### Build Failures

Make sure all dependencies are installed:
```bash
npm install
```

## Migration from Separate Worker

If you were previously using the separate Worker in `/worker`:

1. The API logic has been moved to `/functions/api/` directory
2. D1 database configuration is now in root `wrangler.toml`
3. No need for separate Worker deployment - everything is in Pages
4. You can delete the `/worker` folder after successful migration

## Useful Commands

```bash
# Local development
npm run dev              # Vite dev server
npm run pages:dev        # Pages with Functions

# Database
wrangler d1 list                              # List databases
wrangler d1 execute particles --local --file=./migrations/0001_initial.sql
wrangler d1 execute particles --local --command='SELECT * FROM formations'

# Logs
wrangler pages deployment tail  # View real-time logs
```

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
