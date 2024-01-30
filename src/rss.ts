import {calculate} from 'https://deno.land/std@0.212.0/http/etag.ts';

const hash = (value: string): Promise<ArrayBuffer> =>
  crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));

const guid = async (value: string) =>
  new Uint8Array(await hash(value)).reduce((a, b) => a + b.toString(36), '');

const replace = (
  subject: string,
  search: string,
  replace = '',
  all = false
) => {
  let parts = subject.split(search);
  if (parts.length === 1) return subject;
  if (!all) parts = [parts.shift()!, parts.join(search)];
  return parts.join(replace);
};

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Parse date string, e.g. "1st May 2024"
const parseDate = (time: string) => {
  const parts = time.match(/(\d{1,2})[a-z]{2} (\w+) (\d{4})/i);
  const year = Number.parseInt(parts![3]);
  const month = (months.indexOf(parts![2]) + 1).toString().padStart(2, '0');
  const day = Number.parseInt(parts![1]).toString().padStart(2, '0');
  const date = new Date(`${year}-${month}-${day}`);
  return date;
};

const template = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="/assets/rss.xsl" type="text/xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>JSX.lol</title>
    <description>JSX.lol - Does anybody actually like React? A cherry-picked collection of React criticism.</description>
    <link>https://jsx.lol</link>
    <lastBuildDate>{{lastBuildDate}}</lastBuildDate>
    <atom:link href="https://jsx.lol/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
{{entries}}</channel>
</rss>
`;

const entry = `<item>
  <title>{{title}}</title>
  <description>{{description}}</description>
  <link>{{link}}</link>
  <guid isPermaLink="false">{{guid}}</guid>
  <pubDate>{{pubDate}}</pubDate>
</item>
`;

let cacheBody = '';
let cacheHeaders = new Headers();

// Generate RSS feed from HTML
export const handleRSS = async () => {
  try {
    if (cacheBody) {
      return new Response(cacheBody, {headers: cacheHeaders});
    }
    const html = await Deno.readTextFile(
      new URL('../public/index.html', import.meta.url).pathname
    );
    let body = template;
    let lastBuildDate = '';
    const entries: string[] = [];
    const articles = html.match(/<article[^>]*?>(.*?)<\/article>/gs)!;
    for (const article of articles) {
      const heading = article.match(/<h3[^>]*?>(.*?)<\/h3>/s)![1];
      const blockquote = article.match(
        /<blockquote[^>]*?>(.*?)<\/blockquote>/s
      )![1];
      const link = /href="([^"]*?)"/.exec(heading)![1];
      const title = /<span[^>]*?>(.*?)<\/span>/.exec(heading)![1];
      const description = /<p[^>]*?>(.*?)<\/p>/.exec(blockquote)![1];
      const time = blockquote.match(/<time[^>]*?>(.*?)<\/time>/s)![1];
      const cite = blockquote.match(/<cite[^>]*?>(.*?)<\/cite>/s)![1];
      let xml = entry;
      xml = replace(xml, `{{title}}`, title);
      xml = replace(xml, `{{description}}`, description);
      xml = replace(xml, `{{link}}`, link);
      xml = replace(xml, `{{guid}}`, await guid(link));
      xml = replace(xml, `{{pubDate}}`, parseDate(time).toUTCString());
      entries.push(xml);
      if (!lastBuildDate) {
        lastBuildDate = parseDate(time).toUTCString();
      }
    }
    body = replace(body, `{{lastBuildDate}}`, lastBuildDate);
    body = replace(body, `{{entries}}`, entries.join(''));
    cacheBody = body;
    cacheHeaders = new Headers({
      etag: (await calculate(body)) as string,
      'access-control-allow-origin': '*',
      'last-modified': new Date().toUTCString(),
      'content-type': 'application/xml; charset=utf-8',
      'content-length': body.length.toString()
    });
    return new Response(body, {headers: cacheHeaders});
  } catch (err) {
    console.error(err);
    return new Response(null, {status: 500});
  }
};
