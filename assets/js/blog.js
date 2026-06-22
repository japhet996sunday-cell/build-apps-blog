/**
 * blog.js — Build Apps Blog | Content Management Engine
 * Phase 2B update: featured posts sorting, updatedDate display on cards.
 *
 * Responsibilities:
 *  1. Fetch posts.json and parse post metadata
 *  2. Filter posts by publishDate (auto-publishing scheduler)
 *  3. Sort: featured posts first, then newest-first within each group
 *  4. Render post cards to the homepage grid
 *  5. Support tag filtering and "load more" pagination
 *
 * To publish a new post:
 *  - Add a .html file to /posts/
 *  - Add an entry to posts.json with a future publishDate
 *  - The post appears automatically on that date — no code changes needed
 *
 * New optional fields in posts.json (Phase 2B):
 *  - featured: true          → post is pinned above non-featured posts
 *  - updatedDate: "YYYY-MM-DD" → shown on the card alongside publishDate
 *  - author: { name, bio, avatar, github, linkedin }
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
  visibleCount: BLOG_CONFIG.postsPerPage,
};

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Returns today's date as YYYY-MM-DD in local time.
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
 * Returns true if publishDate is today or in the past.
 */
function isPublished(publishDate) {
  return publishDate <= getTodayString();
}

/**
 * Format a YYYY-MM-DD string into a human-readable date.
 * e.g. "2026-07-07" → "July 7, 2026"
 */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

/**
 * Fetch posts.json, apply the publish-date filter, then sort:
 *   1. Featured posts first (featured: true)
 *   2. Within each group, newest publishDate first
 *
 * If no posts are featured, all posts sort newest-first (same as before).
 */
async function fetchPublishedPosts() {
  const response = await fetch(BLOG_CONFIG.dataSource);

  if (!response.ok) {
    throw new Error(`Failed to load posts.json — HTTP ${response.status}`);
  }

  const posts = await response.json();

  const published = posts.filter(post => isPublished(post.publishDate));

  // Sort: featured posts bubble to the top; within each group, newest first.
  // Boolean subtraction trick: (false - true) = -1, so featured items go first.
  published.sort((a, b) => {
    const featuredDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    if (featuredDiff !== 0) return featuredDiff;
    return a.publishDate < b.publishDate ? 1 : -1;
  });

  return published;
}

// ─── Tag System ───────────────────────────────────────────────────────────────

/**
 * Extract unique tags from published posts and build the filter bar.
 * Prepends "All". Tags are sorted alphabetically.
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

  container.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => handleTagFilter(btn.dataset.tag));
  });
}

/**
 * Handle tag filter button clicks.
 * Re-applies the featured sort within the filtered subset.
 */
function handleTagFilter(tag) {
  state.activeTag = tag;
  state.visibleCount = BLOG_CONFIG.postsPerPage;

  state.filteredPosts = tag === 'All'
    ? [...state.allPosts]
    : state.allPosts.filter(post => post.tags.includes(tag));

  renderTagFilters(state.allPosts);
  renderPostGrid();
}

// ─── Card Rendering ───────────────────────────────────────────────────────────

/**
 * Build HTML for a single post card.
 * Phase 2B: adds a "Featured" badge and updatedDate if present.
 */
function buildPostCard(post) {
  const postUrl = `${BLOG_CONFIG.postsDir}${post.slug}.html`;

  const tagsHtml = post.tags
    .map(tag => `<span class="post-card__tag">${tag}</span>`)
    .join('');

  // Featured badge — only shown when post.featured === true
  const featuredBadge = post.featured
    ? `<span class="post-card__featured-badge" aria-label="Featured post">★ Featured</span>`
    : '';

  // Updated date line — only shown when post.updatedDate exists
  const updatedHtml = post.updatedDate
    ? `<span class="post-card__updated">
         Updated <time datetime="${post.updatedDate}">${formatDate(post.updatedDate)}</time>
       </span>`
    : '';

  return `
    <article class="post-card ${post.featured ? 'post-card--featured' : ''}" data-slug="${post.slug}">
      <a href="${postUrl}" class="post-card__thumbnail-link" aria-label="Read: ${post.title}">
        <div class="post-card__thumbnail">
          ${featuredBadge}
          <img
            src="${post.thumbnail}"
            alt="${post.title} thumbnail"
            loading="lazy"
            decoding="async"
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
          <div class="post-card__dates">
            <time class="post-card__date" datetime="${post.publishDate}">
              ${formatDate(post.publishDate)}
            </time>
            ${updatedHtml}
          </div>
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
 */
function renderPostGrid() {
  const grid = document.querySelector('[data-post-grid]');
  const loadMoreBtn = document.querySelector('[data-load-more]');
  const emptyState = document.querySelector('[data-empty-state]');

  if (!grid) return;

  const slice = state.filteredPosts.slice(0, state.visibleCount);
  const hasMore = state.visibleCount < state.filteredPosts.length;
  const isEmpty = state.filteredPosts.length === 0;

  grid.innerHTML = slice.map(buildPostCard).join('');

  if (emptyState) emptyState.hidden = !isEmpty;
  if (loadMoreBtn) loadMoreBtn.hidden = !hasMore;
}

// ─── Load More ────────────────────────────────────────────────────────────────

function handleLoadMore() {
  state.visibleCount += BLOG_CONFIG.postsPerPage;
  renderPostGrid();
}

// ─── Initialisation ───────────────────────────────────────────────────────────

async function initBlog() {
  const grid = document.querySelector('[data-post-grid]');
  if (!grid) return;

  grid.setAttribute('aria-busy', 'true');

  try {
    const publishedPosts = await fetchPublishedPosts();

    state.allPosts = publishedPosts;
    state.filteredPosts = [...publishedPosts];

    renderTagFilters(publishedPosts);
    renderPostGrid();

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

document.addEventListener('DOMContentLoaded', initBlog);
