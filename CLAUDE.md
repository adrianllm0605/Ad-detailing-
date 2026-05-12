# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static single-page website for **AD Detailing** — a premium car and RV detailing business located at 153 rue Jean-Talon, Châteauguay, QC. Phone: 514-503-9296. Booking: addetailing.setmore.com.

The entire site lives in one file: `index.html` (embedded CSS + JS, no build step).

## Running Locally

```bash
# Any static server works — e.g. Python:
python3 -m http.server 8080
# or Node:
npx serve .
```

Open `http://localhost:8080` in a browser. No build, install, or compile step.

## Deployment

Drop `index.html` (and any added image files) onto any static host:
- GitHub Pages — push to `main`, enable Pages in repo settings
- Netlify / Vercel — drag-and-drop the folder or connect the repo

## Architecture

Everything is self-contained in `index.html`:

| Layer | Approach |
|---|---|
| Layout | CSS Grid + Flexbox, `clamp()` for fluid type |
| Animations | `IntersectionObserver` reveal, canvas particles in hero |
| Interactivity | Vanilla JS — no frameworks or dependencies |
| Fonts | Google Fonts CDN (Montserrat + Open Sans) |

**Section order:** Navbar → Hero → Services → Stats bar → About → Gallery → Reviews → Booking CTA → Footer → Floating "Book Now" button.

**Color tokens** (CSS custom properties at `:root`):
- `--gold` / `--gold-light` — primary accent
- `--blue` — secondary accent (hero title)
- `--dark` / `--dark-2` / `--dark-3` — background layers

## Key Conventions

- All JS runs after DOM is ready (scripts at bottom of `<body>`).
- Scroll-reveal uses three CSS classes: `.reveal` (up), `.reveal-l` (left), `.reveal-r` (right) — the JS observer adds `.vis` to trigger the transition. Stagger with `.d1`–`.d5` delay helpers.
- Animated counters: add `data-count="N"` to any element; JS increments it on first viewport intersection.
- Service cards have a CSS 3-D perspective tilt driven by `mousemove` — keep `transform-style: preserve-3d` on `.services-grid` and `will-change: transform` on `.svc-card`.
- The floating "Book Now" `#fab` button is `display:none` by default and switched to `display:flex` via JS after 400 px of scroll.

## Business Info (for copy edits)

| Field | Value |
|---|---|
| Booking URL | https://addetailing.setmore.com |
| Phone | +1 514-503-9296 |
| Address | 153 rue Jean-Talon, Châteauguay, QC |
| Instagram | @ad_detaiils._ (two i's) |
| TikTok | @ad_details.0 |
| Facebook | @ADdetailing |

## Gallery Images

The gallery section currently shows CSS placeholder cards. To add real photos, replace each `.g-ph` div inside `.g-item` with an `<img>` tag:

```html
<img src="images/interior-before-after.jpg" alt="Interior detail before and after" loading="lazy" />
```

Create an `images/` folder beside `index.html` and add JPEG/WebP files there.
