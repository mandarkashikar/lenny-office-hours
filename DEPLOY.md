# Deploy & Demo Handoff — Lenny's Office Hours

## Current status
- v1 UI is built (landing, topic select, guest select, beluga chat, summary)
- v1.1 grounding is wired (local quote retrieval from `data/guests/*/*.md`)
- Runs locally in Cursor

## Run locally (Cursor)
```bash
cd "/Users/Mandaroc/Documents/Working Folder - OC - Code/lenny-office-hours"
npm install
npm run dev
```
Open: `http://localhost:3000` (or 3001 if 3000 is occupied)

## Production deploy (Vercel)

### First-time login (once)
```bash
npx vercel login
```

### Deploy preview
```bash
npx vercel
```

### Deploy production
```bash
npx vercel --prod
```

## Domain routing idea
- Keep app on Vercel production URL first
- Then connect custom route from your website setup (e.g., `mandark.dev/office-hours`)

## Demo assets captured
Path:
`/Users/Mandaroc/.openclaw/workspace/lenny-office-hours-demo/demo-assets/`

Files:
- `demo-01-landing.png`
- `demo-02-guest-selection.png`
- `demo-03-chat.png`
- `demo-04-summary.png`
- `lenny-office-hours-demo.mp4`
