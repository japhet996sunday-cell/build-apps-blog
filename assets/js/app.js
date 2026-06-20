/**
 * app.js — Build Apps Blog | Global Application Shell
 *
 * Handles site-wide concerns that apply to every page:
 *  - Mobile nav toggle
 *  - Active link highlighting
 *  - Scroll-based header behaviour
 *  - Smooth scroll for anchor links
 *
 * Phase 2 addition:
 *  - Reads posts.json to power the "Previous / Next" navigation
 *    on individual post pages (see initPostNavigation).
 */

'use strict';

// ─── Mobile Navigation ────────────────────────────────────────────────────────

function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav-menu]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    // Prevent body scroll while menu is open
    document.body.classList.toggle('nav-open', isOpen);
  });

  // Close nav when a link inside it is clicked (single-page feel)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
}

// ─── Scroll-aware Header ──────────────────────────────────────────────────────

function initStickyHeader() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Add scrolled class once the user passes 60px
    header.classList.toggle('is-scrolled', currentScrollY > 60);

    // Hide header on scroll-down, reveal on scroll-up (only past the fold)
    if (currentScrollY > 200) {
      header.classList.toggle('is-hidden', currentScrollY > lastScrollY);
    } else {
      header.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
}

// ─── Post Page: Prev / Next Navigation ───────────────────────────────────────

/**
 * On individual post pages, fetch posts.json, find the current post by slug,
 * and populate the prev/next navigation links.
 *
 * The current post slug is read from <meta name="post-slug" content="...">
 * which each post HTML file includes in its <head>.
 */
async function initPostNavigation() {
  const prevLink = document.querySelector('[data-prev-post]');
  const nextLink = document.querySelector('[data-next-post]');
  if (!prevLink && !nextLink) return; // Not on a post page

  const slugMeta = document.querySelector('meta[name="post-slug"]');
  if (!slugMeta) return;

  const currentSlug = slugMeta.getAttribute('content');

  try {
    const response = await fetch('../posts.json');
    if (!response.ok) return;

    const allPosts = await response.json();

    // Apply the same publish filter as blog.js
    const today = getTodayString();
    const published = allPosts
      .filter(p => p.publishDate <= today)
      .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

    const currentIndex = published.findIndex(p => p.slug === currentSlug);
    if (currentIndex === -1) return;

    // "Newer" post = lower index (we're sorted newest-first)
    const newerPost = published[currentIndex - 1] || null;
    // "Older" post = higher index
    const olderPost = published[currentIndex + 1] || null;

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
  } catch (err) {
    // Prev/next is non-critical; fail silently
    console.warn('[BuildAppsBlog] Could not load post navigation:', err);
  }
}

/**
 * Mirrors the same date utility from blog.js so app.js has no dependency on it.
 * Both files are loaded independently to keep concerns separated.
 */
function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initStickyHeader();
  initPostNavigation();
});
