import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', source: 'BBC News' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NY Times' },
];

function parseXMLItems(xml, sourceName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(itemXml) || /<title>([\s\S]*?)<\/title>/.exec(itemXml))?.[1]?.trim() || '';
    const link = (/<link>([\s\S]*?)<\/link>/.exec(itemXml) || /<guid[^>]*>([\s\S]*?)<\/guid>/.exec(itemXml))?.[1]?.trim() || '';
    const descRaw = (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(itemXml) || /<description>([\s\S]*?)<\/description>/.exec(itemXml))?.[1] || '';
    const description = descRaw.replace(/<[^>]*>/g, '').slice(0, 200).trim();
    const pubDate = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml))?.[1]?.trim() || '';
    const enclosureUrl = /<enclosure[^>]+url="([^"]+)"/.exec(itemXml)?.[1] || null;
    const mediaUrl = /<media:content[^>]+url="([^"]+)"/.exec(itemXml)?.[1] || null;
    const mediaThumb = /<media:thumbnail[^>]+url="([^"]+)"/.exec(itemXml)?.[1] || null;
    const imageUrl = enclosureUrl || mediaUrl || mediaThumb || null;
    const guid = (/<guid[^>]*>([\s\S]*?)<\/guid>/.exec(itemXml))?.[1]?.trim() || link;

    if (title && link) {
      items.push({
        id: guid,
        title,
        description,
        url: link,
        image_url: imageUrl,
        published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: sourceName,
        type: 'news',
      });
    }
  }
  return items;
}

async function parseFeed(feedUrl, sourceName) {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${feedUrl}`);
  const xml = await res.text();
  return parseXMLItems(xml, sourceName);
}

Deno.serve(async (_req) => {
  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(f => parseFeed(f.url, f.source))
    );

    const articles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.published) - new Date(a.published))
      .slice(0, 20);

    return Response.json({ articles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});