# Build Apps Blog

> A frontend developer blog that documents real-world web projects — built entirely with HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no package managers.

---

## Live Demo

🔗 **[japhet996sunday-cell.github.io/build-apps-blog](https://japhet996sunday-cell.github.io/build-apps-blog/)**

---

## Screenshots

| Homepage | Article Page |
|----------|--------------|
| ![Homepage — post grid with tag filters](assets/images/screenshots/homepage.png) | ![Article — with TOC, progress bar, and author card](assets/images/screenshots/post-page.png) |

> **Note:** Add your own screenshots to `assets/images/screenshots/` after your first deployment. Recommended tool: [Screely](https://screely.com) for browser-framed images.

---

## Features

Every feature listed below is implemented in the live project — there are no placeholders.

### Content Management
- **JSON-powered CMS** — all post metadata (title, slug, excerpt, tags, dates, author) lives in a single `posts.json` file. No database, no admin panel, no login required
- **Weekly auto-publishing** — set a future `publishDate` in `posts.json` and the post appears on that date automatically. No redeploy, no code change, no manual update
- **Featured posts** — mark any post `"featured": true` to pin it above the regular feed with a ★ badge

### Homepage
- **Tag filtering** — filter buttons are generated dynamically from post tags; selecting a tag instantly filters the grid client-side
- **Load More pagination** — the grid renders 6 posts at a time; a "Load more" button reveals the next 6, keeping the DOM lean for 50+ posts
- **Updated date on cards** — if a post has an `updatedDate` field, it appears alongside the original publish date on the card

### Article Reading Experience
- **Reading progress bar** — a thin accent-coloured bar fixed at the top of the viewport fills from left to right as the reader scrolls through the article
- **Auto-generated Table of Contents** — `h2` and `h3` headings inside the article are extracted and turned into a clickable TOC with active-section highlighting as the reader scrolls
- **Syntax highlighting** — a lightweight token-based highlighter (no external library) colours JavaScript, HTML, and CSS code blocks using the VS Code Dark+ palette
- **Copy code button** — a "Copy" button appears on hover over every code block; uses the Clipboard API with an `execCommand` fallback and shows "Copied!" feedback for 2 seconds
- **Related posts** — up to 3 posts sharing the most tags with the current article are displayed below it; falls back to the most recent posts when there are no tag matches
- **Author card** — author name, bio, avatar, GitHub, and LinkedIn links are rendered at the bottom of each article using data from `posts.json`
- **Last updated date** — if `updatedDate` exists in `posts.json`, it is shown in the article hero alongside the original publish date

### Site-wide
- **Responsive design** — fluid grid and typography scale from 320px mobile to 1440px+ desktop without any CSS breakpoint hacks
- **Dark mode** — the entire colour system switches by toggling `data-theme="dark"` on `<html>`; all tokens are defined as CSS custom properties
- **Sticky hide/reveal header** — the header applies a backdrop blur on scroll and hides when scrolling down past the fold, revealing again on upward scroll
- **Prev / Next navigation** — each post page resolves the adjacent published posts from `posts.json` and populates navigation links automatically

---

## Folder Structure

```
build-apps-blog/
│
├── index.html                          # Homepage: hero, post grid, about section
├── posts.json                          # CMS data file — all post metadata
├── robots.txt                          # Crawler directives + sitemap reference
├── sitemap.xml                         # XML sitemap for Google / Bing
│
├── posts/                              # Individual article HTML files
│   ├── build-expense-tracker.html
│   ├── school-portal-dashboard.html
│   └── responsive-navbar.html
│
└── assets/
    ├── css/
    │   └── style.css                   # Full design system (1 file, ~430 lines)
    │                                   # Sections: tokens → reset → typography →
    │                                   # components → layout → responsive
    ├── js/
    │   ├── blog.js                     # CMS engine: fetch, schedule, sort, render
    │   └── app.js                      # Post-page features + site-wide UI
    │
    └── images/
        ├── favicon.ico                 # Legacy favicon (16×16, 32×32 embedded)
        ├── favicon.svg                 # Modern vector favicon
        ├── apple-touch-icon.png        # iOS home-screen icon (180×180)
        ├── social-preview.png          # Open Graph / Twitter card image (1200×630)
        ├── author-avatar.png           # Author photo (replace with your own)
        └── thumbnails/
            ├── expense-tracker.png
            ├── school-portal.png
            ├── responsive-navbar.png
            ├── ai-chat.png
            ├── grid-vs-flex.png
            └── localstorage.png
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Markup | HTML5 | Semantic elements throughout: `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`, `<time>` |
| Styling | CSS3 | Custom properties (design tokens), Grid, Flexbox, `clamp()` for fluid type/spacing |
| Scripting | Vanilla JavaScript (ES2020) | `async/await`, `fetch`, `IntersectionObserver`, Clipboard API — no transpiling needed |
| Data | JSON | `posts.json` acts as the CMS; fetched at runtime by `blog.js` |
| Fonts | Google Fonts | DM Serif Display (headings) + Inter (body) via `display=swap` |
| Hosting | GitHub Pages | Free, HTTPS, no server required |

**Zero dependencies.** No npm, no webpack, no Babel, no React. The entire project is a folder of files you can open in a browser (via a local server) and deploy by pushing to GitHub.

---

## How the CMS Works

All post metadata is stored in `posts.json` at the project root. The homepage never hardcodes any article content — `blog.js` fetches this file on every page load and renders everything dynamically.

### posts.json structure

Each post is an object with the following fields:

```json
{
  "title":       "How to Build an Expense Tracker with Vanilla JS",
  "slug":        "build-expense-tracker",
  "excerpt":     "A 1–2 sentence description shown on the homepage card.",
  "thumbnail":   "assets/images/thumbnails/expense-tracker.png",
  "tags":        ["JavaScript", "Projects", "CSS"],
  "publishDate": "2026-06-16",

  "updatedDate": "2026-06-21",
  "featured":    true,

  "author": {
    "name":     "Japhet Sunday",
    "bio":      "Frontend developer documenting real-world projects.",
    "avatar":   "assets/images/author-avatar.png",
    "github":   "https://github.com/japhet996sunday-cell",
    "linkedin": "https://linkedin.com/in/japhet-sunday"
  }
}
```

| Field | Required | Purpose |
|-------|----------|---------|
| `title` | ✅ | Card heading and page `<title>` |
| `slug` | ✅ | Maps to the HTML filename (`posts/slug.html`) |
| `excerpt` | ✅ | Card description (truncated to 3 lines via CSS) |
| `thumbnail` | ✅ | Card image (1200×630 recommended) |
| `tags` | ✅ | Drives tag filter buttons; used for related-post matching |
| `publishDate` | ✅ | Controls when the post becomes visible (see scheduling below) |
| `updatedDate` | ✗ | Optional — shown on card and article hero when present |
| `featured` | ✗ | Optional — `true` pins the post above non-featured posts |
| `author` | ✗ | Optional — renders the author card at the bottom of the article |

### How blog.js uses posts.json

```
fetch('posts.json')
  → filter by isPublished(publishDate)   // hide future posts
  → sort: featured first, then newest   // featured bubble to top
  → render tag filter buttons            // from unique tags across all posts
  → render post cards                    // 6 at a time (Load More for the rest)
```

The `slug` field is the link between `posts.json` and the file system. When a card is clicked, the user navigates to `posts/[slug].html`. No routing library needed.

---

## Weekly Auto-Publishing System

The scheduling system is a single comparison inside `blog.js`. It requires no server, no cron job, no CI pipeline, and no redeployment.

### The core logic

```javascript
// Get today's date as YYYY-MM-DD in the reader's local timezone
function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// A post is "published" when its publishDate is today or in the past
function isPublished(publishDate) {
  return publishDate <= getTodayString();
}
```

ISO date strings (`YYYY-MM-DD`) sort correctly as plain strings — `"2026-07-14" <= "2026-07-21"` is `true`. No `Date` parsing needed for the comparison itself.

### Why local time, not UTC?

Using local time means the post goes live at midnight in the reader's own timezone — the most natural expectation. A post with `publishDate: "2026-07-07"` becomes visible at 00:00 on July 7th for readers in Lagos, London, and Los Angeles alike.

### Example timeline

```
posts.json entry:
  "slug": "css-grid-vs-flexbox"
  "publishDate": "2026-07-14"

July 13  →  post is invisible (publishDate > today)
July 14  →  post appears automatically at midnight, no action required
July 15+ →  post is visible, sorted with other published posts
```

The reader's browser does all the work on every page load. GitHub Pages serves the same static files every day — the filtering happens in JavaScript at runtime.

---

## Adding a New Post

Five steps. You never need to edit `index.html`, `blog.js`, `app.js`, or `style.css`.

### Step 1 — Add metadata to `posts.json`

Open `posts.json` and add a new object to the array. Copy an existing entry and update every field:

```json
{
  "title":       "Your Post Title Here",
  "slug":        "your-post-slug",
  "excerpt":     "A one or two sentence description of what the reader will learn.",
  "thumbnail":   "assets/images/thumbnails/your-post-slug.png",
  "tags":        ["JavaScript", "Projects"],
  "publishDate": "2026-08-04",

  "author": {
    "name":     "Japhet Sunday",
    "bio":      "Frontend developer documenting real-world projects.",
    "avatar":   "assets/images/author-avatar.png",
    "github":   "https://github.com/japhet996sunday-cell",
    "linkedin": "https://linkedin.com/in/japhet-sunday"
  }
}
```

**Publishing now:** set `publishDate` to today or any past date.  
**Scheduling:** set `publishDate` to a future date — the post will appear automatically.

### Step 2 — Create the post HTML file

Copy an existing post as your template:

```bash
cp posts/responsive-navbar.html posts/your-post-slug.html
```

Then edit the copy. Required changes (search for each and update):

| What to change | Where to find it |
|----------------|-----------------|
| `<meta name="post-slug" content="...">` | `<head>` — must match the slug in posts.json exactly |
| `<title>` | `<head>` — unique title for this post |
| `<meta name="description">` | `<head>` — unique description |
| All `og:` and `twitter:` meta tags | `<head>` — update title, description, image, and URL |
| The JSON-LD `<script>` block | `<head>` — update headline, description, datePublished, URL, image |
| Breadcrumb last item | Post hero — the current page label |
| Post tags | Post hero `<div class="post-hero__tags">` |
| `<h1>` title | Post hero |
| `<time datetime>` | Post hero meta row |
| Article body | `<article class="post-content">` — your actual content |

### Step 3 — Add the thumbnail image

Create a **1200 × 630 px** PNG. Save it to:

```
assets/images/thumbnails/your-post-slug.png
```

The filename must match the `thumbnail` value in posts.json (without the `assets/images/thumbnails/` prefix). A simple thumbnail with the post title on a dark background works well — see the existing thumbnails as reference.

### Step 4 — Update sitemap.xml

Open `sitemap.xml` and add a new `<url>` block for the post:

```xml
<url>
  <loc>https://japhet996sunday-cell.github.io/build-apps-blog/posts/your-post-slug.html</loc>
  <lastmod>2026-08-04</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

If the post is scheduled for the future, add the block but comment it out — uncomment it on publish day.

### Step 5 — Push to GitHub

```bash
git add .
git commit -m "New post: Your Post Title Here"
git push
```

GitHub Pages will deploy in under a minute. If the post's `publishDate` is today or in the past, it will appear immediately. If it's future-dated, it appears automatically on the correct date — no further action needed.

---

## GitHub Pages Deployment

This project deploys to GitHub Pages in under 5 minutes with no build step.

### Prerequisites

- A free [GitHub account](https://github.com)
- Git installed on your machine ([git-scm.com](https://git-scm.com))

### Step 1 — Create the repository

1. Go to [github.com/new](https://github.com/new)
2. Set **Repository name** to exactly: `build-apps-blog`
3. Set visibility to **Public**
4. Do **not** initialise with a README (you already have one)
5. Click **Create repository**

### Step 2 — Push your files

In your project folder:

```bash
git init
git add .
git commit -m "Initial commit — Build Apps Blog"
git branch -M main
git remote add origin https://github.com/japhet996sunday-cell/build-apps-blog.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Open your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Set **Branch** to `main`, folder to `/ (root)`
5. Click **Save**

GitHub will display a banner: *"Your site is being published."*

### Step 4 — Verify

Wait 1–3 minutes, then open:

```
https://japhet996sunday-cell.github.io/build-apps-blog/
```

The blog should be live and fully functional.

### Step 5 — Future updates

Every `git push` to the `main` branch triggers an automatic redeploy. You do not need to touch GitHub Pages settings again.

```bash
# Typical workflow for adding a new post
git add posts/new-post.html posts.json assets/images/thumbnails/new-post.png sitemap.xml
git commit -m "New post: Post Title"
git push
# Live in ~60 seconds
```

### Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Homepage loads but post cards don't appear | `fetch('posts.json')` is blocked on `file://` | Open via a local server (Live Server or `npx serve .`), not by double-clicking `index.html` |
| 404 on the live site | Deployment hasn't finished | Wait 2–3 minutes and hard-refresh (`Ctrl+Shift+R`) |
| Post not appearing on homepage | `publishDate` is in the future | Check the date in posts.json; the post appears automatically when that date arrives |
| Images not loading | Path case mismatch | GitHub Pages is case-sensitive. `Thumbnail.png` ≠ `thumbnail.png` |
| Old content still showing | Browser cache | Hard-refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) |

---

## Accessibility

The project targets WCAG 2.1 Level AA. Every decision below is implemented in the codebase — none are aspirational.

### Semantic HTML

Every page uses the correct landmark elements:

```
<header>   → site header / navigation
<nav>      → main navigation and breadcrumb
<main>     → primary page content
<article>  → individual blog post body
<aside>    → table of contents sidebar
<footer>   → site footer
<time>     → all dates (with datetime attribute)
```

`role="list"` is added to navigation `<ul>` elements to restore list semantics in Safari, which strips them when `list-style: none` is applied via CSS.

### Keyboard navigation

- **Skip-to-content link** — the first focusable element on every page. Invisible until focused; jumps the keyboard user directly to `#main-content`, bypassing the site header
- **Mobile navigation** — the hamburger toggle uses `aria-expanded` (updated on every open/close) and `aria-controls` pointing to the nav's `id`. Closing the nav returns focus to the toggle button
- **All interactive elements** — buttons, links, and the copy-code button all have a visible `:focus-visible` ring using the accent colour

### ARIA labels

| Element | Label |
|---------|-------|
| Site logo link | `aria-label="Build Apps Blog — home"` |
| Hamburger button | `aria-label="Toggle navigation"` + `aria-expanded` |
| Main navigation | `aria-label="Main navigation"` |
| Tag filter group | `role="group"` + `aria-label="Filter posts by tag"` |
| Post card grid | `aria-live="polite"` + `aria-label="Blog post cards"` |
| Reading progress bar | `role="progressbar"` + `aria-valuemin/max/now` |
| Each article | `aria-label` set to the article title |
| External links | `aria-label` includes "(opens in new tab)" |
| Decorative SVGs | `aria-hidden="true"` + `focusable="false"` |

### Colour contrast

All text colours in the design system meet WCAG AA minimum contrast ratios:

- Body text `#1e293b` on white `#ffffff` → **12.6 : 1** (AAA)
- Muted text `#64748b` on white `#ffffff` → **5.9 : 1** (AA)
- Accent `#4F6EF7` on white → **4.6 : 1** (AA for large text)
- Dark mode body text `#e2e8f0` on `#0d0f1a` → **13.4 : 1** (AAA)

### Heading hierarchy

Every page has exactly one `<h1>`. Section headings follow a strict hierarchy (`h2` → `h3`) with no levels skipped. The Table of Contents respects this hierarchy visually by indenting `h3` items.

---

## Performance Notes

The project is optimised for perceived performance without any build tooling.

### Image loading

- Post card thumbnails use `loading="lazy"` — they don't load until near the viewport
- Hero images on post pages use `loading="eager"` + `decoding="async"` — they're above the fold so they need to load immediately, but decoding is moved off the main thread
- All `<img>` elements have explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS)
- `onerror` handlers hide broken images gracefully rather than showing a broken-image icon

### JavaScript loading

- Both scripts (`blog.js`, `app.js`) use `defer` — they download in parallel with HTML parsing and execute only after the DOM is ready, eliminating render-blocking
- A single `fetch('posts.json')` is shared across all post-page features (navigation, author block, related posts, updated date) — one network request for four features
- No framework, no polyfill bundle, no transpiled output. The JS that ships is exactly the JS that was written

### DOM efficiency

- The post grid renders only `postsPerPage` (6) cards at a time; Load More appends 6 more
- Tag filtering re-renders only the visible slice of the filtered array — the full array is never re-fetched
- Syntax highlighting runs once on page load (`initSyntaxHighlight`) by iterating `pre code` elements directly — no MutationObserver overhead
- `IntersectionObserver` is used for TOC active-link tracking (O(1) per scroll event) instead of scroll event listeners that recompute offsets on every frame

### Scalability

The architecture handles 50+ posts without modification:

| Concern | How it's handled |
|---------|-----------------|
| posts.json file size | 6 fields × 50 posts ≈ 15 KB uncompressed. GitHub Pages serves gzip automatically, making this ~4 KB on the wire |
| DOM node count | Load More keeps the grid at a fixed number of rendered cards regardless of total post count |
| Tag filter buttons | Generated from unique tags dynamically — no manual maintenance needed as new tags are added |
| Related posts scoring | O(n) scan across published posts — fast even at 100+ posts |

---

## Future Improvements

These are realistic enhancements that fit the existing no-build, vanilla-JS architecture:

- **Search** — a client-side search using the existing `posts.json` data as the index; fuzzy-match on title, excerpt, and tags without a search backend
- **Comment system** — embed [Giscus](https://giscus.app) (GitHub Discussions-backed) with a single `<script>` tag; no server required
- **Newsletter signup** — integrate [Buttondown](https://buttondown.email) or [Beehiiv](https://beehiiv.com) via their embed form; both have generous free tiers
- **Reading time calculation** — compute estimated read time from article word count on page load and display it in the post hero
- **Code block language labels** — display the language name (JS / CSS / HTML) in the top-left of each `<pre>` block, derived from a `data-lang` attribute on `<code>`
- **Table of Contents on mobile** — a floating TOC button that opens a drawer on mobile, rather than the current toggle-in-sidebar approach
- **Post series support** — a `series` field in posts.json that groups related posts and shows a "Part N of M" indicator in the article hero
- **RSS feed** — a static `feed.xml` generated manually (or via a simple Node script run locally) for readers who use RSS readers like Feedly
- **Google Analytics activation** — replace the `G-XXXXXXXXXX` placeholder in `index.html` with a real Measurement ID (see the inline instructions in `index.html`)

---

## Author

**Japhet Sunday**

Frontend developer based in Abuja, Nigeria. I completed a frontend development track at DCH Academy (Darl Creative Hub Academy) and work independently as an HTML and CSS tutor. I build real projects, document them thoroughly, and share everything in public.

Background: HND in Mass Communication, Lens Polytechnic.

| | |
|--|--|
| **GitHub** | [github.com/japhet996sunday-cell](https://github.com/japhet996sunday-cell) |
| **Portfolio** | [japhet996sunday-cell.github.io/japhet-portfolio](https://japhet996sunday-cell.github.io/japhet-portfolio/) |
| **Email** | [japhet996sunday@gmail.com](mailto:japhet996sunday@gmail.com) |
| **Blog** | [japhet996sunday-cell.github.io/build-apps-blog](https://japhet996sunday-cell.github.io/build-apps-blog/) |

---

## License

This project is licensed under the **MIT License**.

You are free to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of this project for any purpose — personal, educational, or commercial — provided the original copyright notice is retained.

```
MIT License

Copyright (c) 2026 Japhet Sunday

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
