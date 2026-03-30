# Lenny's Office Hours (v1.1)

Beluga/iMessage-style PM learning simulator.

## What v1 includes
- Topic selection (7 PM topics)
- Guest selection (2-4 guests, topic-aware)
- Beluga-style group chat UI
- Simulated opening takes per guest
- User follow-up loop + hot-seat trigger
- Session summary with key quotes + weekly actions

## Project path
`/Users/Mandaroc/Documents/Working Folder - OC - Code/lenny-office-hours`

## Run locally (Cursor / Terminal)

### 1) Open in Cursor
- File → Open Folder → `lenny-office-hours`
- Open integrated terminal

### 2) Install deps
```bash
npm install
```

### 3) Start dev server
```bash
npm run dev
```
Open: http://localhost:3000

## Build for production
```bash
npm run build
npm run start
```

## Deploy options

### Option A: Vercel (fastest)
```bash
npm i -g vercel
vercel
```
Then set custom path/domain routing via your existing `mandark.dev` project.

### Option B: Local deploy (manual)
- `npm run build`
- `npm run start`
- reverse proxy with Caddy/Nginx if needed

## Notes
- UI remains unchanged from v1.
- Data pipeline outputs are under `data/` (topic-index.json, guests.json, and guest markdown files).
- No paid API dependency is required for the current experience.

## v1.1 grounding
Chat responses are now grounded in local markdown files at:
- `data/guests/{guest-slug}/{topic}.md`

How it works:
- Guest IDs are mapped to slugs (`teresa → teresa-torres`, `marty → marty-cagan`, `shreyas → shreyas-doshi`, `claire → claire-vo`, `lenny → lenny-rachitsky`).
- The app parses `### Passage X` sections and cleans quoted transcript text.
- For each response, it picks the most relevant passage based on topic + user prompt keywords.
- It returns the first sentence or two as the guest reply.
- If a file/topic is missing, it falls back to the existing hardcoded response text.
