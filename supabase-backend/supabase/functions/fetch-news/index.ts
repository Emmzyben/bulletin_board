import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', source: 'BBC News' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NY Times' },
]

function parseXMLItems(xml: string, sourceName: string): any[] {
  const items: any[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]

    const title = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(itemXml) || /<title>([\s\S]*?)<\/title>/.exec(itemXml))?.[1]?.trim() || ''
    const link = (/<link>([\s\S]*?)<\/link>/.exec(itemXml) || /<guid[^>]*>([\s\S]*?)<\/guid>/.exec(itemXml))?.[1]?.trim() || ''
    const descRaw = (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(itemXml) || /<description>([\s\S]*?)<\/description>/.exec(itemXml))?.[1] || ''
    const description = descRaw.replace(/<[^>]*>/g, '').slice(0, 200).trim()
    const pubDate = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml))?.[1]?.trim() || ''
    const enclosureUrl = /<enclosure[^>]+url="([^"]+)"/.exec(itemXml)?.[1] || null
    const mediaUrl = /<media:content[^>]+url="([^"]+)"/.exec(itemXml)?.[1] || null
    const mediaThumb = /<media:thumbnail[^>]+url="([^"]+)"/.exec(itemXml)?.[1] || null
    const imageUrl = enclosureUrl || mediaUrl || mediaThumb || null
    const guid = (/<guid[^>]*>([\s\S]*?)<\/guid>/.exec(itemXml))?.[1]?.trim() || link

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
      })
    }
  }
  return items
}

async function parseFeed(feedUrl: string, sourceName: string): Promise<any[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${feedUrl}`)
    const xml = await res.text()
    return parseXMLItems(xml, sourceName)
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const feedPromises = RSS_FEEDS.map(feed => parseFeed(feed.url, feed.source))
    const feedResults = await Promise.all(feedPromises)

    // Flatten and sort by published date
    const allNews = feedResults
      .flat()
      .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
      .slice(0, 50) // Limit to 50 items

    return new Response(
      JSON.stringify({ news: allNews }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})