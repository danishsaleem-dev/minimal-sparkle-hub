# By Areeqaan — Admin Dashboard

## Git author (required for verified commits)

Always run this before making any commits:

```bash
git config --global user.email noreply@anthropic.com
git config --global user.name Claude
```

## Pushing

- Production branch: `main`
- Local proxy (127.0.0.1) always returns 403 — push via PAT URL:
  `GIT_ASKPASS=echo git push https://<PAT>@github.com/danishsaleem-dev/minimal-sparkle-hub.git HEAD:main`
- After pushing, always run `git fetch origin main` to sync the local tracking ref

## Stack

- TanStack Start (SSR) + TanStack Router (file-based)
- Supabase (Postgres + Storage bucket: `products`)
- Tailwind CSS v4 + shadcn/ui
- Sonner toasts — `<Toaster />` is mounted in `__root.tsx`
- Vercel deployment via Build Output API v3

## Vercel build notes

- `nitro: { preset: "vercel" }` must be at TOP LEVEL of `defineConfig` in `vite.config.ts`
- `vercel.json` must have `"framework": null` and NO `outputDirectory` field
- `scripts/vercel-postbuild.js` generates `.vercel/output/config.json` (Nitro 3 beta doesn't do this)
- Build script: `"build": "vite build && node scripts/vercel-postbuild.js"`
