import {serveDir} from 'https://deno.land/std@0.212.0/http/file_server.ts';

Deno.serve(async (request: Request) => {
  const response = await serveDir(request, {
    fsRoot: new URL('./public', import.meta.url).pathname,
    quiet: true
  });
  const url = new URL(request.url);
  if (url.protocol.startsWith('https')) {
    response.headers.set(
      'strict-transport-security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  response.headers.set(
    'content-security-policy',
    `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; img-src 'self' data:; font-src 'self'; style-src 'self';`
  );
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'same-origin');
  response.headers.set('x-frame-options', 'DENY');
  return response;
});
