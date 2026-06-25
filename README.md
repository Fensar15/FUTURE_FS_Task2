# Mini CRM — Client Lead Management System

A lightweight CRM for tracking leads from a website contact form all the way
through to becoming a client. Built as a small full-stack app: leads come in
through a public contact form, land in a secure admin dashboard, and move
through a simple pipeline — **New → Contacted → Converted** — with
follow-up notes logged along the way.

## Features

- **Lead capture** — a public contact form (`contact.html`) posts straight
  into the system, the same way a real website's contact form would.
- **Lead listing** — name, email, phone, source, status, and received date
  for every lead, in one dashboard.
- **Status pipeline** — update any lead's status between New, Contacted,
  and Converted; the pipeline bar on the dashboard updates instantly.
- **Follow-up notes** — log calls, emails, and updates against each lead,
  with a timestamp on every entry.
- **Secure admin access** — the dashboard sits behind a login screen, and
  every lead/notes/stats API route requires a valid signed-in session
  (JSON Web Token) — there's no way to read lead data without logging in.
- **Search & filter** *(bonus)* — search by name, email, or source, and
  filter by status.
- **Timestamps** *(bonus)* — every lead and note records when it was
  created; leads also track when they were last updated.
- **Simple analytics** *(bonus)* — total leads, a breakdown by status, and
  a conversion rate, shown as a segmented pipeline bar.

## Tech stack

| Layer    | Choice                                   |
|----------|-------------------------------------------|
| Frontend | HTML / CSS / vanilla JavaScript            |
| Backend  | Node.js + Express                          |
| Database | [lowdb](https://github.com/typicode/lowdb) — a small embedded JSON database |
| Auth     | JWT (`jsonwebtoken`) + hashed passwords (`bcryptjs`) |

A note on the database: the task lists MongoDB or MySQL as options. This
project uses **lowdb** instead — a tiny embedded JSON-file database with
no server to install and no native modules to compile, so `npm install`
works the same way on every machine. The data model (documents with an
embedded `notes` array) is intentionally close to how you'd shape this in
MongoDB, so swapping it out later for a real MongoDB connection is a
small, contained change — mainly inside `src/db.js` and the route files,
not the frontend.

## Project structure

```
mini-crm/
├── server.js                # Express app entry point
├── package.json
├── .env.example              # copy to .env to configure
├── db.json                   # created automatically on first run
├── src/
│   ├── db.js                 # database setup + seed data
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   └── routes/
│       ├── auth.js           # POST /api/auth/login
│       ├── leads.js          # protected lead CRUD + stats
│       └── public.js         # POST /api/public/leads (no auth)
└── public/
    ├── login.html            # admin sign-in
    ├── index.html             # admin dashboard
    ├── contact.html           # public lead capture form
    ├── css/style.css
    └── js/
        ├── login.js
        ├── app.js              # dashboard logic
        └── contact.js
```

## Setup

Requires [Node.js](https://nodejs.org/) 18 or later.

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
# (optional: edit .env to set your own ADMIN_USERNAME / ADMIN_PASSWORD / JWT_SECRET)

# 3. Start the server
npm start
```

Then open:

- **Admin dashboard:** http://localhost:5000/login.html
- **Public contact form:** http://localhost:5000/contact.html

On first run, the server creates an admin account automatically and
prints the credentials to the terminal (default: `admin` / `admin123`,
unless you set different ones in `.env`). It also seeds three sample
leads so the dashboard isn't empty the first time you open it — delete
them from the dashboard whenever you're ready for real data.

## How it fits together

1. A visitor fills out `contact.html` (a stand-in for your real website's
   contact form) → it `POST`s to `/api/public/leads` → a new lead is saved
   with status `new`.
2. You log in at `login.html` → the dashboard at `index.html` fetches
   `/api/leads` and `/api/leads/stats` to show the pipeline and table.
3. Clicking a lead opens a detail drawer where you can change its status,
   read its message, and log follow-up notes — each saved with a
   timestamp.

## API reference

All `/api/leads*` routes require `Authorization: Bearer <token>`.

| Method | Route                       | Description                          |
|--------|------------------------------|---------------------------------------|
| POST   | `/api/public/leads`          | Create a lead (public, no auth)       |
| POST   | `/api/auth/login`            | Log in, returns a JWT                 |
| GET    | `/api/leads?search=&status=` | List leads, with optional search/filter |
| GET    | `/api/leads/stats`           | Totals, status breakdown, conversion rate |
| GET    | `/api/leads/:id`              | Get one lead, with its notes          |
| PATCH  | `/api/leads/:id/status`      | Update a lead's status                |
| POST   | `/api/leads/:id/notes`       | Add a follow-up note                  |
| DELETE | `/api/leads/:id`              | Delete a lead                         |

## Pushing this to GitHub

```bash
git init
git add .
git commit -m "Mini CRM: lead capture, pipeline tracking, and admin dashboard"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

(`.gitignore` already excludes `node_modules/`, `.env`, and `db.json`, so
your seeded data and secrets won't end up in the repo.)
