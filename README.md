# Hexwell

Readable catalog of ISO, DIN, JIS, and ASTM bolts, nuts, washers, and pins.

## Host on GitHub Pages

This repo is already set up for GitHub Pages.

### Steps

1. Create a new repository on GitHub (e.g. `hexwell` or `username.github.io`).
2. Push this code to the `main` branch:

```bash
git init
git add .
git commit -m "Initial commit: Hexwell fastener catalog"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

3. In the GitHub repo:
   - Go to **Settings → Pages**
   - Under **Build and deployment**, set **Source** to **GitHub Actions**

4. The included workflow (`.github/workflows/pages.yml`) will:
   - Install dependencies
   - Run `npm run build:pages` (static SPA with correct base path)
   - Deploy to GitHub Pages

5. After the first successful workflow run, your site will be live at:
   - `https://YOUR_USERNAME.github.io/YOUR_REPO/` (project site)
   - or `https://YOUR_USERNAME.github.io/` (if repo is `YOUR_USERNAME.github.io`)

### Local development

```bash
npm ci
npm run dev
```

Open http://localhost:8080

### Local static build (same as Pages)

```bash
npm run build:pages
# output in ./gh-pages
npx serve gh-pages
```

### Notes

- All fastener data is static JSON (client-side). No backend required for core features.
- Auth / multiplayer / server features are disabled or no-op in the static GitHub Pages build.
- Base path is handled automatically by the workflow for project vs user sites.
