const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const domain = 'https://www.ukulelemalaysia.com';
const internalOnly = new Set(['list.html']);

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function pagePath(file) {
  if (file === 'index.html') return '/';
  return `/${file.replace(/\.html$/, '')}`;
}

const htmlFiles = fs.readdirSync(root)
  .filter(file => file.endsWith('.html'))
  .filter(file => !internalOnly.has(file))
  .filter(file => !file.endsWith('-sptt.html'))
  .sort();

const expectedPaths = new Set(htmlFiles.map(pagePath));
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const sitemapPaths = new Set(locs.map(loc => {
  const url = new URL(loc);
  if (url.origin !== domain) {
    throw new Error(`Unexpected sitemap domain: ${loc}`);
  }
  return url.pathname.replace(/\/$/, '/') || '/';
}));

const missing = [...expectedPaths].filter(item => !sitemapPaths.has(item));
const stale = [...sitemapPaths].filter(item => !expectedPaths.has(item));
const privatePaths = ['/list', '/list.html'];
const privateInSitemap = privatePaths.filter(item => sitemapPaths.has(item));
const robotIssues = [
  robots.includes('Disallow: /list') ? null : 'robots.txt missing Disallow: /list',
  robots.includes('Disallow: /list.html') ? null : 'robots.txt missing Disallow: /list.html',
  robots.includes(`${domain}/sitemap.xml`) ? null : 'robots.txt missing sitemap URL'
].filter(Boolean);

const errors = [
  ...missing.map(item => `Missing from sitemap: ${item}`),
  ...stale.map(item => `Sitemap URL has no matching HTML file: ${item}`),
  ...privateInSitemap.map(item => `Internal page must stay out of sitemap: ${item}`),
  ...robotIssues
];

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Sitemap OK: ${expectedPaths.size} public pages checked; internal /list is blocked.`);
