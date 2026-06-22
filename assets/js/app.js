/**
 * app.js — Build Apps Blog | Global Application Shell
 *
 * Site-wide (every page):
 *   - initMobileNav()        — hamburger toggle
 *   - initStickyHeader()     — scroll-aware header hide/show
 *
 * Post pages only (detected by <meta name="post-slug">):
 *   - initPostNavigation()   — prev/next links from posts.json
 *   - initReadingProgress()  — thin progress bar fixed at top
 *   - initTableOfContents()  — auto-generated TOC from h2/h3, active highlight
 *   - initRelatedPosts()     — 3 tag-matched posts injected below article
 *   - renderAuthorBlock()    — author card from posts.json author field
 *   - renderUpdatedDate()    — reveals updatedDate in post hero if present
 *   - initSyntaxHighlight()  — lightweight token-based code colouring
 *   - initCopyButtons()      — clipboard copy button on every <pre><code>
 */

'use strict';

// ─── Shared utilities ─────────────────────────────────────────────────────────

/** Returns today as YYYY-MM-DD (local time). */
function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Format YYYY-MM-DD → "Month D, YYYY" */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── 1. Mobile Navigation ─────────────────────────────────────────────────────

function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav    = document.querySelector('[data-nav-menu]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  });

  // Close menu when any link inside it is clicked
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
}

// ─── 2. Sticky / Hide-on-scroll Header ───────────────────────────────────────

function initStickyHeader() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Add backdrop/shadow once user scrolls past 60px
    header.classList.toggle('is-scrolled', currentScrollY > 60);

    // Hide header on downward scroll past the fold; reveal on upward scroll
    if (currentScrollY > 200) {
      header.classList.toggle('is-hidden', currentScrollY > lastScrollY);
    } else {
      header.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
}

// ─── 3. Prev / Next Post Navigation ──────────────────────────────────────────

/**
 * Populate the [data-prev-post] and [data-next-post] links on a post page.
 * Receives the full allPosts array so we don't need an extra fetch().
 *
 * "Newer" = lower array index (we sort newest-first)
 * "Older" = higher array index
 *
 * @param {string}   currentSlug
 * @param {Object[]} allPosts
 */
function initPostNavigation(currentSlug, allPosts) {
  const prevLink = document.querySelector('[data-prev-post]');
  const nextLink = document.querySelector('[data-next-post]');
  if (!prevLink && !nextLink) return;

  const today = getTodayString();

  // Only published posts, sorted newest-first (same order as homepage)
  const published = allPosts
    .filter(p => p.publishDate <= today)
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  const currentIndex = published.findIndex(p => p.slug === currentSlug);
  if (currentIndex === -1) return;

  const newerPost = published[currentIndex - 1] || null; // index before = newer
  const olderPost = published[currentIndex + 1] || null; // index after  = older

  if (nextLink) {
    if (newerPost) {
      nextLink.href = `${newerPost.slug}.html`;
      nextLink.querySelector('[data-nav-label]').textContent = newerPost.title;
      nextLink.hidden = false;
    } else {
      nextLink.hidden = true;
    }
  }

  if (prevLink) {
    if (olderPost) {
      prevLink.href = `${olderPost.slug}.html`;
      prevLink.querySelector('[data-nav-label]').textContent = olderPost.title;
      prevLink.hidden = false;
    } else {
      prevLink.hidden = true;
    }
  }
}

// ─── 4. Reading Progress Bar ──────────────────────────────────────────────────

/**
 * Creates a thin bar (height: 3px) fixed at the very top of the viewport.
 * Width goes from 0% to 100% as the reader scrolls through the page.
 *
 * How the percentage is calculated:
 *   scrolled   = how far the user has scrolled from the top (window.scrollY)
 *   scrollable = total scrollable distance = full page height - viewport height
 *   percent    = (scrolled / scrollable) × 100, clamped to 0–100
 *
 * The bar is injected as the very first child of <body> so it sits above
 * everything else in the stacking context. z-index: 1000 keeps it on top
 * of the sticky header.
 */
function initReadingProgress() {
  const article = document.querySelector('.post-content');
  if (!article) return;

  const bar = document.createElement('div');
  bar.className = 'reading-progress-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Reading progress');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', '0');
  document.body.prepend(bar);

  function updateProgress() {
    const scrolled    = window.scrollY;
    const scrollable  = document.documentElement.scrollHeight - window.innerHeight;
    const percent     = scrollable > 0
      ? Math.min(100, (scrolled / scrollable) * 100)
      : 0;

    bar.style.width = `${percent}%`;
    bar.setAttribute('aria-valuenow', Math.round(percent));
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress(); // Set initial value on page load
}

// ─── 5. Table of Contents ─────────────────────────────────────────────────────

/**
 * Scans .post-content for h2 and h3 elements, generates slug IDs for each
 * heading that lacks one, builds a flat ordered list (h3 is indented via CSS),
 * and injects the result into [data-toc-target].
 *
 * Active section tracking uses IntersectionObserver with a rootMargin that
 * narrows the detection zone to the top ~10–20% of the viewport. This means
 * a heading is highlighted when it has just scrolled past the top of the
 * screen — i.e. it's the section the reader is currently in.
 *
 * Mobile: a toggle button (data-toc-toggle) collapses the TOC body.
 * Desktop: the TOC widget becomes position:sticky (via CSS).
 */
function initTableOfContents() {
  const article   = document.querySelector('.post-content');
  const tocTarget = document.querySelector('[data-toc-target]');
  if (!article || !tocTarget) return;

  const headings = Array.from(article.querySelectorAll('h2, h3'));

  // TOC isn't useful for articles with fewer than 2 headings
  if (headings.length < 2) {
    tocTarget.closest('.toc-widget')?.setAttribute('hidden', '');
    return;
  }

  // Assign stable IDs to headings that don't already have one.
  // "How to Build a Form" → "how-to-build-a-form"
  headings.forEach(heading => {
    if (!heading.id) {
      heading.id = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  // Build a flat <ol>; h3 items get the .toc__item--sub class for indentation
  let html = '<ol class="toc__list">';
  headings.forEach(h => {
    const isSub = h.tagName === 'H3';
    html += `
      <li class="toc__item${isSub ? ' toc__item--sub' : ''}">
        <a class="toc__link" href="#${h.id}">${h.textContent.trim()}</a>
      </li>`;
  });
  html += '</ol>';
  tocTarget.innerHTML = html;

  const tocLinks = tocTarget.querySelectorAll('.toc__link');

  // ── Active heading tracking ────────────────────────────────────────────────
  // rootMargin "-10% 0px -80% 0px" = only consider headings in the top 10–20%
  // of the viewport as "active", so the highlighted link corresponds to the
  // section the reader is actually in, not the next one coming into view below.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach(link => link.classList.remove('is-active'));
      const activeLink = tocTarget.querySelector(`a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add('is-active');
    });
  }, { rootMargin: '-10% 0px -80% 0px' });

  headings.forEach(h => observer.observe(h));

  // ── Mobile toggle ──────────────────────────────────────────────────────────
  const tocToggle = document.querySelector('[data-toc-toggle]');
  const tocBody   = document.querySelector('[data-toc-body]');

  if (tocToggle && tocBody) {
    tocToggle.addEventListener('click', () => {
      const isOpen = tocBody.classList.toggle('is-open');
      tocToggle.setAttribute('aria-expanded', String(isOpen));
      // Update button label to reflect current state
      tocToggle.textContent = isOpen ? '▲ Hide' : '▼ Show';
    });
  }
}

// ─── 6. Related Posts ─────────────────────────────────────────────────────────

/**
 * Score every published post (excluding the current one) by how many tags
 * it shares with the current post. Return the top 3.
 *
 * Tie-breaking: if two posts share the same number of tags with the current
 * post, the newer one (higher publishDate) wins.
 *
 * Fallback: if fewer than 3 tag-matched posts exist, the remaining slots are
 * filled with the most recent other published posts (score = 0 but still
 * returned since we slice the sorted array which includes all candidates).
 *
 * @param {string}   currentSlug
 * @param {string[]} currentTags
 * @param {Object[]} allPosts
 * @returns {Object[]} Up to 3 related posts
 */
function findRelatedPosts(currentSlug, currentTags, allPosts) {
  const today = getTodayString();

  // Exclude the current post and any future-dated posts
  const candidates = allPosts.filter(
    p => p.slug !== currentSlug && p.publishDate <= today
  );

  // Score each candidate by shared tag count
  const scored = candidates.map(post => ({
    post,
    score: post.tags.filter(tag => currentTags.includes(tag)).length,
  }));

  // Sort: highest score first; ties broken by newest publishDate
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.post.publishDate < b.post.publishDate ? 1 : -1;
  });

  return scored.slice(0, 3).map(s => s.post);
}

/**
 * Inject the Related Posts section into [data-related-posts] > .rp-inner.
 *
 * The section uses a two-level selector so the heading and grid sit inside
 * the .container for proper max-width / padding:
 *
 *   <section data-related-posts>
 *     <div class="container">                ← layout wrapper (in HTML)
 *       <div class="rp-inner">               ← JS injects here
 *         <h2>Related Posts</h2>
 *         <div class="related-posts__grid">…</div>
 *       </div>
 *     </div>
 *   </section>
 *
 * @param {Object[]} relatedPosts
 */
function renderRelatedPosts(relatedPosts) {
  const section = document.querySelector('[data-related-posts]');
  if (!section) return;

  if (relatedPosts.length === 0) {
    section.hidden = true;
    return;
  }

  // Target the inner injection point, not the section itself, so we
  // don't overwrite the .container wrapper that controls page width.
  const inner = section.querySelector('.rp-inner');
  if (!inner) return;

  const cardsHtml = relatedPosts.map(post => `
    <article class="related-card">
      <a href="${post.slug}.html" class="related-card__link" aria-label="Read: ${post.title}">
        <div class="related-card__thumbnail">
          <img
            src="../${post.thumbnail}"
            alt="${post.title} thumbnail"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none'"
          />
        </div>
        <div class="related-card__body">
          <div class="related-card__tags">
            ${post.tags.map(t => `<span class="post-tag post-tag--sm">${t}</span>`).join('')}
          </div>
          <h3 class="related-card__title">${post.title}</h3>
          <time class="related-card__date" datetime="${post.publishDate}">
            ${formatDate(post.publishDate)}
          </time>
        </div>
      </a>
    </article>
  `).join('');

  inner.innerHTML = `
    <h2 class="related-posts__heading">Related Posts</h2>
    <div class="related-posts__grid">${cardsHtml}</div>
  `;

  section.hidden = false;
}

// ─── 7. Author Block ──────────────────────────────────────────────────────────

/**
 * Build and inject the author card into [data-author-block].
 * Data comes from the current post's "author" object in posts.json.
 * The block stays hidden if the post has no author object.
 *
 * Avatar fallback: if no avatar image is provided (or if the image fails
 * to load), we display a circle containing the author's initials.
 *
 * @param {Object} author  — { name, bio, avatar?, github?, linkedin? }
 */
function renderAuthorBlock(author) {
  const target = document.querySelector('[data-author-block]');
  if (!target || !author) return;

  // Build social link HTML only if the URL exists
  const githubLink = author.github ? `
    <a href="${author.github}"
       class="author-card__link author-card__link--github"
       target="_blank" rel="noopener noreferrer"
       aria-label="${author.name} on GitHub">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
      GitHub
    </a>` : '';

  const linkedinLink = author.linkedin ? `
    <a href="${author.linkedin}"
       class="author-card__link author-card__link--linkedin"
       target="_blank" rel="noopener noreferrer"
       aria-label="${author.name} on LinkedIn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      LinkedIn
    </a>` : '';

  // Avatar: real image with initials-circle fallback
  const initials   = author.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const avatarHtml = author.avatar ? `
    <img
      src="../${author.avatar}"
      alt="${author.name}"
      class="author-card__avatar"
      width="64" height="64"
      loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
    />
    <div class="author-card__avatar-fallback" aria-hidden="true" style="display:none">${initials}</div>
    ` : `
    <div class="author-card__avatar-fallback" aria-hidden="true">${initials}</div>`;

  target.innerHTML = `
    <div class="author-card">
      <div class="author-card__avatar-wrap">${avatarHtml}</div>
      <div class="author-card__body">
        <p class="author-card__name">${author.name}</p>
        <p class="author-card__bio">${author.bio}</p>
        <div class="author-card__links">${githubLink}${linkedinLink}</div>
      </div>
    </div>
  `;
  target.hidden = false;
}

// ─── 8. Updated Date in Post Meta ────────────────────────────────────────────

/**
 * Reveal [data-updated-date] in the post hero and populate its <time> element.
 * The element is hidden by default in HTML; this function only shows it when
 * the post's posts.json entry has a non-empty "updatedDate" field.
 *
 * @param {string} updatedDate  — YYYY-MM-DD string from posts.json
 */
function renderUpdatedDate(updatedDate) {
  const target = document.querySelector('[data-updated-date]');
  if (!target || !updatedDate) return;

  const timeEl = target.querySelector('time');
  if (timeEl) {
    timeEl.setAttribute('datetime', updatedDate);
    timeEl.textContent = formatDate(updatedDate);
  }
  target.hidden = false;
}

// ─── 9. Syntax Highlighting ───────────────────────────────────────────────────

/**
 * Lightweight token-based syntax highlighter — no external library needed.
 *
 * How it works:
 *   1. Take the raw text content of each <code> element (codeEl.textContent).
 *      textContent gives decoded text, so "&lt;" becomes "<".
 *   2. Re-encode HTML entities so our injected <span> tags are the only markup.
 *   3. Apply a series of regex replacements to wrap token types in <span>s.
 *   4. Set codeEl.innerHTML to render the spans as HTML.
 *
 * Token types and CSS classes:
 *   .sh-comment   — // line comments and /* block * / comments
 *   .sh-string    — "double", 'single', `template` string literals
 *   .sh-keyword   — JS/CSS reserved words
 *   .sh-number    — numeric literals
 *   .sh-function  — function calls (word followed by open paren)
 *   .sh-tag       — HTML tag names (<div, </span)
 *   .sh-attr      — HTML attribute names (class=, id=, href=)
 *   .sh-property  — CSS property names (color:, display:)
 *   .sh-value     — CSS values (#hex, px/em/%, url(), rgb())
 *
 * Order is deliberate: comments and strings are matched first so keywords
 * inside them don't get double-tagged.
 *
 * Limitation: this is a best-effort highlighter using regexes, not a full
 * parser. Edge cases exist. For a production parser, swap in Prism.js with
 * the same CSS variable colour scheme — the classes are compatible.
 */
function highlightCode(rawText) {
  // Step 1: encode HTML entities so we can inject <span> tags safely.
  // rawText comes from textContent (already decoded), so we must re-encode.
  let h = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // ── Comments (highest priority — wrap before anything else) ───────────────
  h = h.replace(/(\/\/[^\n]*)/g,           '<span class="sh-comment">$1</span>');
  h = h.replace(/(\/\*[\s\S]*?\*\/)/g,     '<span class="sh-comment">$1</span>');

  // ── String literals ───────────────────────────────────────────────────────
  h = h.replace(/(\"(?:[^\"\\]|\\.)*\")/g, '<span class="sh-string">$1</span>');
  h = h.replace(/(\'(?:[^\'\\]|\\.)*\')/g, '<span class="sh-string">$1</span>');
  h = h.replace(/(` + '`' + `(?:[^` + '`' + `\\]|\\.)*` + '`' + `)/g,   '<span class="sh-string">$1</span>');

  // ── JavaScript keywords ───────────────────────────────────────────────────
  const jsKeywords = [
    'const','let','var','function','return','if','else','for','while','do',
    'switch','case','break','continue','new','class','extends','import',
    'export','default','from','try','catch','finally','throw','async',
    'await','typeof','instanceof','in','of','true','false','null',
    'undefined','this','super',
  ].join('|');
  h = h.replace(
    new RegExp(`\\b(${jsKeywords})\\b`, 'g'),
    '<span class="sh-keyword">$1</span>'
  );

  // ── Numeric literals ──────────────────────────────────────────────────────
  h = h.replace(/\b(\d+\.?\d*)\b/g, '<span class="sh-number">$1</span>');

  // ── Function calls: word( ─────────────────────────────────────────────────
  h = h.replace(
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g,
    '<span class="sh-function">$1</span>'
  );

  // ── HTML: tags (&lt;tagname and &lt;/tagname) ─────────────────────────────
  h = h.replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9-]*)/g, '<span class="sh-tag">$1</span>');

  // ── HTML: attribute names (word=) ─────────────────────────────────────────
  h = h.replace(/\b([a-zA-Z-]+)(=)/g, '<span class="sh-attr">$1</span>$2');

  // ── CSS: property names (word:) ───────────────────────────────────────────
  // The (?!:) negative lookahead prevents matching pseudo-selectors like ::before
  h = h.replace(/\b([a-zA-Z-]+)(\s*:(?!:))/g, '<span class="sh-property">$1</span>$2');

  // ── CSS: values (hex colours, units, url(), rgb()) ───────────────────────
  h = h.replace(
    /(#[0-9a-fA-F]{3,8}|[-\d.]+(?:px|em|rem|vh|vw|%)|url\([^)]*\)|rgba?\([^)]*\))/g,
    '<span class="sh-value">$1</span>'
  );

  return h;
}

/**
 * Apply syntax highlighting to every <pre><code> block on the page.
 * We set innerHTML (not textContent) so the <span> colour tokens render.
 */
function initSyntaxHighlight() {
  // querySelectorAll with a descendant selector works in all browsers;
  // no need for :has() here.
  document.querySelectorAll('pre code').forEach(codeEl => {
    const rawText = codeEl.textContent;   // decoded plain text
    codeEl.innerHTML = highlightCode(rawText);
    codeEl.classList.add('sh-highlighted');
  });
}

// ─── 10. Copy Code Buttons ────────────────────────────────────────────────────

/**
 * Wrap each <pre> in a .code-block-wrapper <div> and add a "Copy" button.
 *
 * Clipboard API:
 *   navigator.clipboard.writeText() is Promise-based and requires a secure
 *   context (HTTPS or localhost). On plain HTTP it will be undefined, so we
 *   fall back to the older document.execCommand('copy') approach via a
 *   temporary <textarea>.
 *
 * Feedback:
 *   Button text changes to "Copied!" for 2 seconds, then resets. The
 *   aria-label also updates so screen-reader users get feedback.
 *
 * Browser compatibility:
 *   querySelectorAll('pre code') targets all <pre><code> blocks without
 *   needing :has() (which only landed in all browsers in late 2023).
 *   We then walk up to the <pre> parent from the <code> element.
 */
function initCopyButtons() {
  // Use 'pre code' selector (universal support) instead of 'pre:has(code)'
  document.querySelectorAll('pre code').forEach(codeEl => {
    const preEl = codeEl.closest('pre');
    if (!preEl || preEl.closest('.code-block-wrapper')) return; // avoid double-wrap

    // Wrap <pre> in a relative-position container for button positioning
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    preEl.parentNode.insertBefore(wrapper, preEl);
    wrapper.appendChild(preEl);

    // Create and configure the button
    const btn = document.createElement('button');
    btn.className    = 'copy-code-btn';
    btn.textContent  = 'Copy';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    wrapper.appendChild(btn);

    btn.addEventListener('click', async () => {
      // Get plain text (strips our syntax-highlight <span>s if present)
      const text = codeEl.textContent;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          // Preferred: async Clipboard API (requires HTTPS / localhost)
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback: synchronous execCommand via hidden textarea
          const textarea       = document.createElement('textarea');
          textarea.value       = text;
          textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        // Visual + accessible feedback
        btn.textContent = 'Copied!';
        btn.classList.add('is-copied');
        btn.setAttribute('aria-label', 'Code copied to clipboard');

        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', 'Copy code to clipboard');
        }, 2000);

      } catch (err) {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        console.warn('[BuildAppsBlog] Copy failed:', err);
      }
    });
  });
}

// ─── Post page orchestration ──────────────────────────────────────────────────

/**
 * All post-page features are co-ordinated here.
 *
 * Features that need no data (progress bar, TOC, syntax highlighting, copy
 * buttons) are started immediately. Features that need posts.json (nav,
 * author, updatedDate, related posts) wait for a single shared fetch.
 *
 * Single fetch pattern: one network request for posts.json, shared across
 * all four data-dependent features. If the fetch fails, those features
 * degrade silently — the article is still fully readable.
 */
async function initPostPageFeatures() {
  const slugMeta = document.querySelector('meta[name="post-slug"]');
  if (!slugMeta) return; // Not a post page — exit early

  const currentSlug = slugMeta.getAttribute('content');

  // Start features that don't need posts.json immediately
  initReadingProgress();
  initTableOfContents();
  initSyntaxHighlight();
  initCopyButtons();

  // Fetch posts.json once for all remaining features
  try {
    const response = await fetch('../posts.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const allPosts   = await response.json();
    const currentPost = allPosts.find(p => p.slug === currentSlug);

    // Prev / Next navigation
    initPostNavigation(currentSlug, allPosts);

    // Author block (optional — only shown if the post has an author field)
    if (currentPost?.author) {
      renderAuthorBlock(currentPost.author);
    }

    // Updated date (optional — only shown if updatedDate field exists)
    if (currentPost?.updatedDate) {
      renderUpdatedDate(currentPost.updatedDate);
    }

    // Related posts — tag-scored, excluding current post, up to 3
    const currentTags = currentPost?.tags || [];
    const related     = findRelatedPosts(currentSlug, currentTags, allPosts);
    renderRelatedPosts(related);

  } catch (err) {
    // Non-fatal: article is readable without these enhancements
    console.warn('[BuildAppsBlog] Post features: could not load posts.json:', err);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initStickyHeader();
  initPostPageFeatures(); // Async — runs all post-page enhancements
});
