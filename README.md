# Sicheng Qian — Personal Website

A hand-built, luxury-editorial portfolio for **Sicheng Qian** — mathematics undergraduate at
The Ohio State University, working at the intersection of theoretical machine learning and topology.

Static HTML, CSS and vanilla JavaScript. No build step, no framework, no runtime dependencies.

---

## Highlights

- **Editorial design system** — Fraunces (variable serif), Inter Tight, JetBrains Mono, all
  self-hosted with `font-display: swap`. Obsidian + ember palette, paper-light alternative.
- **Live “metric space” hero** — a seeded canvas of hypotheses, distance edges, and a pulsing
  ε-neighbourhood. Pointer-reactive, DPR-aware, pauses off-screen, static under reduced motion.
- **Motion with restraint** — masked name reveal, intro counter, scroll-triggered reveals with
  stagger, spotlight cards, subtle 3D tilt, magnetic-feeling buttons.
- **Command palette** — `⌘K` / `Ctrl K` (or `/`) opens quick navigation, actions, and links.
  Full keyboard support.
- **Theme switch** — dark ⇄ light, persisted in `localStorage`, respects first paint (no flash).
- **Mobile-first** — full-screen menu with the nav retained, responsive grids, 44px targets.
- **Print-ready résumé** — `resume.html` is a separate, one-page, print-perfect CV
  (Letter, print CSS included). The original PDF is bundled at `assets/Sicheng_Qian_CV.pdf`.
- **Accessibility** — semantic landmarks, skip link, visible focus states, ARIA on the
  dialog/menu/toggles, `prefers-reduced-motion` support, no JS-only content.
- **Share-ready** — Open Graph / Twitter card with a generated 1200×630 image, JSON-LD
  `Person` schema, favicon and Apple touch icon.

## Structure

```
.
├── index.html                  # the site
├── resume.html                 # print / web résumé (one page when printed)
├── 404.html                    # on-brand not-found page
├── assets/
│   ├── css/
│   │   ├── fonts.css           # @font-face declarations
│   │   └── style.css           # design system + layout + motion + print
│   ├── js/main.js              # theme, palette, canvas, reveals, counters, tilt…
│   ├── fonts/                  # Fraunces, Inter Tight, JetBrains Mono (latin, woff2)
│   ├── img/                    # favicon.svg, apple-touch-icon.png, og.png
│   └── Sicheng_Qian_CV.pdf     # downloadable CV
├── .nojekyll                   # keep GitHub Pages from running Jekyll
└── README.md
```

## Preview locally

Any static server works:

```bash
python3 -m http.server 8765
# open http://localhost:8765
```

## Deploy to GitHub Pages

**Option A — user site (recommended): `https://qsc032376-hash.github.io`**

```bash
# 1. create an empty repository named <username>.github.io on github.com
git init -b main
git add .
git commit -m "Personal website"
git remote add origin https://github.com/qsc032376-hash/qsc032376-hash.github.io.git
git push -u origin main
```

GitHub Pages will publish it at `https://qsc032376-hash.github.io` within a minute
(Settings → Pages → Source: *Deploy from a branch* → `main` / `/root`).

**Option B — project site: `https://qsc032376-hash.github.io/portfolio`**

Push the same files to a repo called `portfolio`, then in **Settings → Pages** choose
`main` / `/root`. All paths in this site are relative, so it works from a subdirectory.

Canonical and social URLs are already set to **https://qsc032376-hash.github.io/** in `index.html`.

```html
<link rel="canonical" href="https://qsc032376-hash.github.io/">
<meta property="og:url" content="https://qsc032376-hash.github.io/">
<meta property="og:image" content="https://qsc032376-hash.github.io/assets/img/og.png">
<meta name="twitter:image" content="https://qsc032376-hash.github.io/assets/img/og.png">
```

## Editing content

All copy lives in `index.html`, grouped by section with comment banners
(`PROFILE`, `RESEARCH`, `LEADERSHIP`, `EXPERIENCE`, `PROJECTS`, `TOOLKIT`, `EDUCATION`, `CONTACT`).
`resume.html` mirrors the CV and carries the phone number; the public page intentionally
does not print it.

To swap the downloadable CV, replace `assets/Sicheng_Qian_CV.pdf` with an updated file of the
same name.

## Notes

- Phone number: present in `resume.html` and the PDF only. Add it to the contact section of
  `index.html` if you want it on the public page.
- The hero canvas is deterministic (seeded), so the composition is identical on every load.
- `prefers-reduced-motion` disables the intro, canvas animation, cursor ring, tilt and reveals.

---

Designed and built for Sicheng Qian · 2026
