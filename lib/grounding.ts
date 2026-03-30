import { promises as fs } from 'node:fs';
import path from 'node:path';

type EpisodeMeta = { title: string; url: string; slug: string; date: string };
type EpisodeLinksFile = { byGuest: Record<string, EpisodeMeta[]>; bySlug: Record<string, string> };

let _episodeLinks: EpisodeLinksFile | null = null;

async function getEpisodeLinks(): Promise<EpisodeLinksFile> {
  if (_episodeLinks) return _episodeLinks;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'data', 'episode-links.json'), 'utf-8');
    _episodeLinks = JSON.parse(raw) as EpisodeLinksFile;
  } catch {
    _episodeLinks = { byGuest: {}, bySlug: {} };
  }
  return _episodeLinks;
}

export async function getEpisodeUrlForGuestName(guestName: string): Promise<string | null> {
  const links = await getEpisodeLinks();

  const exact = links.byGuest[guestName];
  if (exact?.length) return exact[0].url;

  const guestNameLc = guestName.toLowerCase();
  const fuzzyKey = Object.keys(links.byGuest).find((k) => k.toLowerCase().includes(guestNameLc) || guestNameLc.includes(k.toLowerCase()));
  if (fuzzyKey && links.byGuest[fuzzyKey]?.length) return links.byGuest[fuzzyKey][0].url;

  // Fallback so every guest message can still deep-link to an official Lenny's Podcast video search.
  return `https://www.youtube.com/@LennysPodcast/search?query=${encodeURIComponent(guestName)}`;
}

const GUEST_SLUG_MAP: Record<string, string> = {
  teresa: 'teresa-torres',
  marty: 'marty-cagan',
  shreyas: 'shreyas-doshi',
  claire: 'claire-vo',
  jeff: 'jeff-weinstein',
  gibson: 'gibson-biddle',
  asha: 'asha-sharma',
  mikek: 'mike-krieger',
  lenny: 'lenny-rachitsky',
};

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'been',
  'from',
  'have',
  'into',
  'just',
  'like',
  'most',
  'only',
  'that',
  'them',
  'then',
  'they',
  'this',
  'what',
  'when',
  'with',
  'your',
  'you',
  'for',
  'the',
  'and',
  'are',
  'but',
]);

function toTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function stripOuterQuotes(text: string): string {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”'))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function cleanupPassage(block: string): string {
  const noOuterQuotes = stripOuterQuotes(block);
  const noSpeakerPrefix = noOuterQuotes.replace(/^\*\*[^*]+\*\*\s*\([^)]+\):\s*/i, '');

  return noSpeakerPrefix
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^"|"$/g, '')
    .trim();
}

function extractPassages(markdown: string): string[] {
  const passages: string[] = [];
  const regex = /###\s+Passage\s+\d+\s*\n([\s\S]*?)(?=\n###\s+Passage\s+\d+|$)/g;

  for (const match of markdown.matchAll(regex)) {
    const cleaned = cleanupPassage(match[1] ?? '');
    if (cleaned) passages.push(cleaned);
  }

  return passages;
}

function firstTwoSentences(text: string): string {
  const sentenceMatches = text.match(/[^.!?]+[.!?]+["']?/g);
  if (!sentenceMatches?.length) return text;
  return sentenceMatches.slice(0, 2).join(' ').trim();
}

function scorePassage(passage: string, queryTokens: string[]): number {
  if (!queryTokens.length) return 0;
  const haystack = passage.toLowerCase();
  return queryTokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
}

function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export type GroundedResult = { text: string; episodeUrl: string | null };

export async function getGroundedGuestSnippet(args: {
  guestId: string;
  topicId: string;
  userMessage?: string;
  excludeTexts?: string[];
}): Promise<GroundedResult | null> {
  const { guestId, topicId, userMessage, excludeTexts = [] } = args;
  const slug = GUEST_SLUG_MAP[guestId];
  if (!slug) return null;

  const mdPath = path.join(process.cwd(), 'data', 'guests', slug, `${topicId}.md`);

  let markdown: string;
  try {
    markdown = await fs.readFile(mdPath, 'utf-8');
  } catch {
    return null;
  }

  const passages = extractPassages(markdown);
  if (!passages.length) return null;

  const queryTokens = toTokens(`${topicId.replace(/-/g, ' ')} ${userMessage ?? ''}`);

  const ranked = passages
    .map((passage) => ({ passage, score: scorePassage(passage, queryTokens) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => firstTwoSentences(item.passage));

  const excluded = new Set(excludeTexts.map((t) => normalizeForCompare(t)));
  const best = ranked.find((candidate) => !excluded.has(normalizeForCompare(candidate))) ?? ranked[0];

  if (!best) return null;

  // Look up the guest's real name from the markdown header for the URL lookup
  const headerMatch = markdown.match(/^#\s+(.+?)\s+on\s+/m);
  const guestRealName = headerMatch?.[1]?.trim() ?? '';
  const episodeUrl = await getEpisodeUrlForGuestName(guestRealName);

  return { text: best, episodeUrl };
}
