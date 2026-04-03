const DEFAULT_RSS_URL = 'https://feeds.buzzsprout.com/2388927.rss';

export type Episode = {
  title: string;
  link: string;
  publishedAt: string;
  description: string;
  audioUrl: string | null;
  imageUrl: string | null;
  rssGuid: string | null;
  episodeId: string | null;
};

export type PodcastData = {
  podcastTitle: string;
  latestEpisode: Episode | null;
};

export type PodcastFeedData = {
  podcastTitle: string;
  episodes: Episode[];
};

const toPlainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const decodeEntities = (value: string) =>
  value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const readTag = (source: string, tag: string): string | null => {
  const match = source.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeEntities(match[1].trim()) : null;
};

const readEnclosureUrl = (source: string): string | null => {
  const match = source.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
  return match ? decodeEntities(match[1].trim()) : null;
};

const readItunesImageUrl = (source: string): string | null => {
  const itunesMatch = source.match(/<itunes:image[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/itunes:image>)?/i);

  if (itunesMatch) {
    return decodeEntities(itunesMatch[1].trim());
  }

  const imageBlock = source.match(/<image>([\s\S]*?)<\/image>/i);

  if (!imageBlock) {
    return null;
  }

  return readTag(imageBlock[1], 'url');
};

const extractBuzzsproutEpisodeId = (...values: Array<string | null>): string | null => {
  const patterns = [
    /Buzzsprout-(\d+)/i,
    /\/episodes\/(\d+)(?:-|\/|$)/i,
    /\/\d+\/(\d+)(?:-|\/|$)/i,
    /\/(\d+)\.mp3(?:$|[?#])/i
  ];

  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match?.[1]) {
        return match[1];
      }
    }
  }

  return null;
};

const getChannelBlock = (xml: string): string | null => {
  const match = xml.match(/<channel>([\s\S]*?)<\/channel>/i);
  return match ? match[1] : null;
};

const getItemBlocks = (channelBlock: string): string[] => {
  return [...channelBlock.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
};

const parseEpisode = (itemBlock: string): Episode => {
  const descriptionRaw = readTag(itemBlock, 'description') ?? '';
  const link = readTag(itemBlock, 'link') ?? '#';
  const audioUrl = readEnclosureUrl(itemBlock);
  const rssGuid = readTag(itemBlock, 'guid');
  const episodeId = extractBuzzsproutEpisodeId(rssGuid, link, audioUrl);

  return {
    title: readTag(itemBlock, 'title') ?? 'Episode',
    link,
    publishedAt: readTag(itemBlock, 'pubDate') ?? '',
    description: toPlainText(descriptionRaw),
    audioUrl,
    imageUrl: readItunesImageUrl(itemBlock),
    rssGuid,
    episodeId
  };
};

export async function getPodcastFeedData(): Promise<PodcastFeedData> {
  const rssUrl = import.meta.env.PODCAST_RSS_URL ?? DEFAULT_RSS_URL;

  try {
    const response = await fetch(rssUrl);

    if (!response.ok) {
      throw new Error(`RSS hentning fejlede med status ${response.status}`);
    }

    const xml = await response.text();
    const channel = getChannelBlock(xml);

    if (!channel) {
      throw new Error('Kunne ikke finde kanal i RSS-data');
    }

    const podcastTitle = readTag(channel, 'title') ?? 'Podcasten om Odense Bulldogs';
    const episodes = getItemBlocks(channel).map(parseEpisode);

    return {
      podcastTitle,
      episodes
    };
  } catch (error) {
    console.error('Fejl ved hentning af podcast-feed', error);

    return {
      podcastTitle: 'Podcasten om Odense Bulldogs',
      episodes: []
    };
  }
}

export async function getPodcastData(): Promise<PodcastData> {
  const feed = await getPodcastFeedData();

  return {
    podcastTitle: feed.podcastTitle,
    latestEpisode: feed.episodes[0] ?? null
  };
}
