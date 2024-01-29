import {encodeBase64} from 'https://deno.land/std@0.212.0/encoding/base64.ts';
import * as lcss from 'npm:lightningcss';

const {code} = lcss.bundle({
  filename: new URL('../public/assets/main.css', import.meta.url).pathname,
  minify: true,
  sourceMap: false,
  include: lcss.Features.Nesting
});

let css = new TextDecoder().decode(code);
css = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();

const cssHash = encodeBase64(
  new Uint8Array(
    await crypto.subtle.digest('sha-256', new TextEncoder().encode(css))
  )
);

const cssPath = new URL('../public/assets/main.min.css', import.meta.url)
  .pathname;

await Promise.all([
  Deno.writeTextFile(cssPath, css),
  Deno.writeTextFile(cssPath.replace(/\.css$/, '.txt'), cssHash)
]);
