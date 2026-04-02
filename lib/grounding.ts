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
  const fuzzyKey = Object.keys(links.byGuest).find(
    (k) => k.toLowerCase().includes(guestNameLc) || guestNameLc.includes(k.toLowerCase())
  );
  if (fuzzyKey && links.byGuest[fuzzyKey]?.length) return links.byGuest[fuzzyKey][0].url;

  return `https://www.youtube.com/@LennysPodcast/search?query=${encodeURIComponent(guestName)}`;
}

// Semantic search using OpenRouter embeddings
async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { embedding?: number[] }[] };
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
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

function stripOuterQuotes(text: string): string {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
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

function extractSentences(text: string, count: number = 3): string {
  const sentenceMatches = text.match(/[^.!?]+[.!?]+["']?/g);
  if (!sentenceMatches?.length) return text;
  let result = sentenceMatches.slice(0, count).join(' ').trim();
  if (result.length > 300) {
    result = sentenceMatches.slice(0, Math.max(1, count - 1)).join(' ').trim();
  }
  return result;
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
  history?: { name: string; text: string; guestId?: string; mine?: boolean }[];
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

  // Build semantic search query: topic + user message + recent conversation
  const recentContext = args.history
    ?.slice(-4)
    .filter((m) => !m.mine)
    .map((m) => m.text)
    .join(' ') ?? '';

  const query = `${topicId.replace(/-/g, ' ')} ${userMessage ?? ''} ${recentContext}`.trim();

  // Get embedding for the query
  const queryEmbedding = await getEmbedding(query);

  let ranked: Array<{ passage: string; score: number }> = [];

  if (queryEmbedding) {
    // Semantic search: embed each passage and score by similarity
    const scored: Array<{ passage: string; embedding: number[]; score: number }> = [];

    for (const passage of passages) {
      const embedding = await getEmbedding(passage);
      if (!embedding) continue;
      const score = cosineSimilarity(queryEmbedding, embedding);
      scored.push({ passage, embedding, score });
    }

    ranked = scored
      .sort((a, b) => b.score - a.score)
      .map((item) => ({
        passage: extractSentences(item.passage, 3),
        score: item.score,
      }));
  } else {
    // Fallback: if embedding fails, prefer longer passages
    ranked = passages
      .map((passage) => ({
        passage: extractSentences(passage, 3),
        score: passage.split(/\s+/).length,
      }))
      .sort((a, b) => b.score - a.score);
  }

  if (!ranked.length) return null;

  // Find first non-excluded passage
  const excluded = new Set(excludeTexts.map((t) => normalizeForCompare(t)));
  const best = ranked.find((item) => !excluded.has(normalizeForCompare(item.passage)));

  if (!best) return null;

  const headerMatch = markdown.match(/^#\s+(.+?)\s+on\s+/m);
  const guestRealName = headerMatch?.[1]?.trim() ?? '';
  const episodeUrl = await getEpisodeUrlForGuestName(guestRealName);

  return { text: best.passage, episodeUrl };
}
