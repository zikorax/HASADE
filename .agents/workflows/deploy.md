---
description: How to deploy to VPS safely without data loss
---

## Deploy to VPS (HASADE)

// turbo-all

### Steps:

1. SSH into your VPS

2. Navigate to the project directory:
```bash
cd /path/to/hassad
```

3. Pull the latest code:
```bash
git pull
```

4. Install dependencies (runs `prisma generate` automatically):
```bash
npm install
```

5. **FIRST TIME ONLY** — Mark the baseline migration as already applied (since your VPS DB already has all tables):
```bash
npx prisma migrate resolve --applied 0_baseline
```

6. Apply any new migrations safely (will NOT drop data):
```bash
npx prisma migrate deploy
```

7. Build the app:
```bash
npm run build
```

8. Restart the app:
```bash
pm2 restart HASADE
```

---

> **⚠️ NEVER run `prisma db push` on production.** It can drop tables and delete all your data. Always use `prisma migrate deploy` instead.

> After the first deploy with this workflow, skip step 5. Only steps 3-4, 6-8 are needed for future deploys.
