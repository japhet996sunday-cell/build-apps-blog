/**
 * blog.js — Build Apps Blog | Content Management Engine
 *
 * Responsibilities:
 *  1. Fetch posts.json and parse post metadata
 *  2. Filter posts by publishDate (auto-publishing scheduler)
 *  3. Render post cards to the homepage grid
 *  4. Support tag filtering and "load more" pagination
 *
 * To publish a new post:
 *  - Add a .html file to /posts/
 *  - Add an entry to posts.json with a future publishDate
 *  - The post appears automatically on that date — no code changes needed
 */

'use strict';

// ─── Configuration ────────────────────────────────────────────────────────────

const BLOG_CONFIG = {
  postsPerPage: 6,          // Cards shown per "page" before Load More
  dataSource: 'posts.json', // Path to CMS data file (relative to root)
  postsDir: 'posts/',       // Directory where post HTML files live
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  allPosts: [],        // All published posts (filtered by date)
  filteredPosts: [],   // Posts after tag filter is applied
  activeTag: 'All',   // Currently selected tag filter
  visibleCount: BLOG_CONFIG.postsPerPage, // How many cards are rendered
};

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Returns today's date as a YYYY-MM-DD string using local time.
 * Using local date (not UTC) ensures the post goes live at midnight
 * in the reader's own timezone, which is the most intuitive behaviour.
 */
function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Auto-publishing filter.
 * Returns true if the post's publishDate is today or in the past.
 * Future-dated posts are silently excluded — they need no manual hiding.
 *
 * @param {string} publishDate - ISO date string from posts.json (YYYY-MM-DD)
 * @returns {boolean}
 */
function isPublished(publishDate) {
  return publishDate <= getTodayString();
}

/**
 * Format a YYYY-MM-DD string into a human-readable date.
 * e.g. "2026-07-07" → "July 7, 2026"
 *
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct date at noon local time to avoid any UTC-offset edge cases
  const date = new Date(year, month - 1, day, 12);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

/**
 * Fetch and parse posts.json, then apply the publish-date filter.
 * Posts are returned newest-first (descending publishDate).
 *
 * @returns {Promise<Object[]>} Array of published post objects
 */
async function fetchPublishedPosts() {
  const response = await fetch(BLOG_CONFIG.dataSource);

  if (!response.ok) {
    throw new Error(`Failed to load posts.json — HTTP ${response.status}`);
  }

  const posts = await response.json();

  // Filter to only published posts, then sort newest first
  const published = posts
    .filter(post => isPublished(post.publishDate))
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  return published;
}

// ─── Tag System ───────────────────────────────────────────────────────────────

/**
 * Extract all unique tags from the published posts and build the
 * filter bar above the post grid. Prepends an "All" option.
 *
 * @param {Object[]} posts
 */
function renderTagFilters(posts) {
  const tagSet = new Set();
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));

  const tags = ['All', ...Array.from(tagSet).sort()];

  const container = document.querySelector('[data-tag-filters]');
  if (!container) return;

  container.innerHTML = tags
    .map(tag => `
      <button
        class="tag-filter-btn ${tag === state.activeTag ? 'is-active' : ''}"
        data-tag="${tag}"
        aria-pressed="${tag === state.activeTag}"
      >
        ${tag}
      </button>
    `)
    .join('');

  // Attach click handlers
  container.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => handleTagFilter(btn.dataset.tag));
  });
}

/**
 * Handle tag filter button clicks.
 * Updates active state, filters posts, and re-renders the grid from page 1.
 *
 * @param {string} tag
 */
function handleTagFilter(tag) {
  state.activeTag = tag;
  state.visibleCount = BLOG_CONFIG.postsPerPage;

  state.filteredPosts = tag === 'All'
    ? [...state.allPosts]
    : state.allPosts.filter(post => post.tags.includes(tag));

  renderTagFilters(state.allPosts); // Re-render to update active button
  renderPostGrid();
}

// ─── Card Rendering ───────────────────────────────────────────────────────────

/**
 * Build the HTML for a single post card.
 *
 * @param {Object} post
 * @returns {string} HTML string
 */
function buildPostCard(post) {
  const postUrl = `${BLOG_CONFIG.postsDir}${post.slug}.html`;
  const tagsHtml = post.tags
    .map(tag => `<span class="post-card__tag">${tag}</span>`)
    .join('');

  return `
    <article class="post-card" data-slug="${post.slug}">
      <a href="${postUrl}" class="post-card__thumbnail-link" aria-label="Read: ${post.title}">
        <div class="post-card__thumbnail">
          <img
            src="${post.thumbnail}"
            alt="${post.title} thumbnail"
            loading="lazy"
            onerror="this.style.display='none'"
          />
        </div>
      </a>
      <div class="post-card__body">
        <div class="post-card__tags">${tagsHtml}</div>
        <h2 class="post-card__title">
          <a href="${postUrl}">${post.title}</a>
        </h2>
        <p class="post-card__excerpt">${post.excerpt}</p>
        <footer class="post-card__footer">
          <time class="post-card__date" datetime="${post.publishDate}">
            ${formatDate(post.publishDate)}
          </time>
          <a href="${postUrl}" class="post-card__read-link" aria-hidden="true">
            Read post →
          </a>
        </footer>
      </div>
    </article>
  `;
}

/**
 * Render the post grid and "Load More" button.
 * Only renders up to state.visibleCount posts from state.filteredPosts.
 */
function renderPostGrid() {
  const grid = document.querySelector('[data-post-grid]');
  const loadMoreBtn = document.querySelector('[data-load-more]');
  const emptyState = document.querySelector('[data-empty-state]');

  if (!grid) return;

  const slice = state.filteredPosts.slice(0, state.visibleCount);
  const hasMore = state.visibleCount < state.filteredPosts.length;
  const isEmpty = state.filteredPosts.length === 0;

  // Render cards (or clear the grid)
  grid.innerHTML = slice.map(buildPostCard).join('');

  // Show / hide the "no posts" empty state
  if (emptyState) {
    emptyState.hidden = !isEmpty;
  }

  // Show / hide Load More button
  if (loadMoreBtn) {
    loadMoreBtn.hidden = !hasMore;
  }
}

// ─── Load More ────────────────────────────────────────────────────────────────

/**
 * Reveal the next page of posts when the user clicks "Load More".
 */
function handleLoadMore() {
  state.visibleCount += BLOG_CONFIG.postsPerPage;
  renderPostGrid();
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Bootstrap the blog on pages that include the post grid.
 * Exits silently if no grid container is found (e.g. on individual post pages).
 */
async function initBlog() {
  const grid = document.querySelector('[data-post-grid]');
  if (!grid) return; // Not on a page with a post listing

  // Show skeleton / loading state while fetching
  grid.setAttribute('aria-busy', 'true');

  try {
    const publishedPosts = await fetchPublishedPosts();

    state.allPosts = publishedPosts;
    state.filteredPosts = [...publishedPosts];

    renderTagFilters(publishedPosts);
    renderPostGrid();

    // Wire up Load More button
    const loadMoreBtn = document.querySelector('[data-load-more]');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', handleLoadMore);
    }
  } catch (err) {
    console.error('[BuildAppsBlog] Could not load posts:', err);

    grid.innerHTML = `
      <p class="blog-error">
        Posts couldn't be loaded right now. Please try refreshing the page.
      </p>
    `;
  } finally {
    grid.removeAttribute('aria-busy');
  }
}

// Run as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', initBlog);
