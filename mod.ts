import {serveDir} from 'https://deno.land/std@0.212.0/http/file_server.ts';
import {handleRSS} from './src/rss.ts';

const cssMin = await Deno.readTextFile(
  new URL('./public/assets/main.min.css', import.meta.url).pathname
);

const cssHash = await Deno.readTextFile(
  new URL('./public/assets/main.min.txt', import.meta.url).pathname
);

const cssRegex = /<link rel="stylesheet"[^>]+?>/;

const defaultCSP = [
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
  "default-src 'none'",
  "manifest-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'"
];

const feeds = ['/atom.xml', '/feed.xml'];
const feedsRegex = /^\/(atom|feed|rss)\/?$/;

Deno.serve(async (request: Request) => {
  const url = new URL(request.url);

  // Redirect common feed URLs
  if (feeds.includes(url.pathname) || feedsRegex.test(url.pathname)) {
    return Response.redirect(new URL('/rss.xml', url), 308);
  }

  // Serve static files
  let response = await serveDir(request, {
    fsRoot: new URL('./public', import.meta.url).pathname,
    quiet: true
  });

  // Set CSP header
  let csp = defaultCSP.join('; ') + '; ';

  // Handle RSS feed
  if (url.pathname === '/rss.xml') {
    csp += `script-src 'self'; style-src 'self'; `;
    response = await handleRSS();
  }

  // Inline stylesheet
  if (url.pathname === '/') {
    csp += `style-src 'sha256-${cssHash}'; `;
    if (response.ok && response.body) {
      let body = await response.text();
      body = body.replace(cssRegex, `<style>${cssMin}</style>`);
      response = new Response(body, response);
    }
  }

  // Add headers
  response.headers.set('content-security-policy', csp);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'same-origin');
  response.headers.set('x-frame-options', 'DENY');
  if (url.protocol.startsWith('https')) {
    response.headers.set(
      'strict-transport-security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
});
