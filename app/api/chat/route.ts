import { NextResponse } from 'next/server';
import { getEpisodeUrlForGuestName, getGroundedGuestSnippet } from '@/lib/grounding';
import { GUESTS, getTopicById } from '@/lib/topics';

type ChatRequest = {
  guestId?: string;
  topicId?: string;
  userMessage?: string;
  fallback?: string;
  excludeTexts?: string[];
  history?: { name: string; text: string; guestId?: string; mine?: boolean }[];
};

async function generateWithLLM(args: {
  guestId: string;
  topicId: string;
  userMessage: string;
  history: { name: string; text: string; guestId?: string; mine?: boolean }[];
  groundedText?: string;
  fallback: string;
}): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const guest = GUESTS.find((g) => g.id === args.guestId);
  const topic = getTopicById(args.topicId);
  if (!guest) return null;

  const model =
    process.env.OPENROUTER_MODEL ||
    process.env.OPENAI_MODEL ||
    'qwen/qwen3.6-plus-preview:free';

  const historyText = args.history
    .slice(-14)
    .map((h) => `${h.name}: ${h.text}`)
    .join('\n');

  const system = `You are ${guest.name} in a multi-person PM office-hours group chat.

Your voice:
- Bio: ${guest.bio}
- Story: ${guest.story}
- Tone: Authentic, opinionated, and grounded. You have strong convictions but explain them clearly.

How you speak:
- Keep it real. Short, punchy sentences. No corporate jargon or buzzwords.
- Be specific. Use concrete examples, frameworks, or lessons from your work.
- Disagree when you genuinely do—but do it respectfully. Show your thinking.
- One bold take per message, not a listicle.
- React naturally to what others say. Build on ideas, poke holes, ask follow-ups.
- Give actionable advice: one thing they can try this week.

Constraints:
- 2-4 sentences max.
- No bullet points. No markdown. No ALL CAPS.
- Stay grounded in ${topic.title}.
- Don't repeat yourself or other guests.
- Sound like a real person in a chat, not a Wikipedia entry.`;

  const user = `Topic: ${topic.title}
Latest message from user: ${args.userMessage}

Recent chat:
${historyText}

---

Grounding from their actual work/archive:
${args.groundedText ?? 'N/A'}

Instructions: Weave the grounding snippet naturally into your answer if it's relevant. Don't cite it explicitly ("As I said..."). Just think it and respond. If it's not relevant, ignore it and answer from your perspective.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      top_p: 0.9,
      max_tokens: 300,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  return text;
}

export async function POST(req: Request) {
  let body: ChatRequest;

  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const guestId = body.guestId?.trim();
  const topicId = body.topicId?.trim();

  if (!guestId || !topicId) {
    return NextResponse.json({ error: 'guestId and topicId are required' }, { status: 400 });
  }

  const grounded = await getGroundedGuestSnippet({
    guestId,
    topicId,
    userMessage: body.userMessage,
    excludeTexts: body.excludeTexts ?? [],
  });

  const llmText = await generateWithLLM({
    guestId,
    topicId,
    userMessage: body.userMessage ?? '',
    history: body.history ?? [],
    groundedText: grounded?.text,
    fallback: body.fallback ?? 'Strong take. What context should we know?',
  });

  const guest = GUESTS.find((g) => g.id === guestId);
  const fallbackEpisodeUrl = guest ? await getEpisodeUrlForGuestName(guest.name) : null;

  return NextResponse.json({
    text: llmText ?? grounded?.text ?? body.fallback ?? 'Strong take. What context should we know?',
    episodeUrl: grounded?.episodeUrl ?? fallbackEpisodeUrl ?? null,
    grounded: Boolean(grounded),
    modelBacked: Boolean(llmText),
  });
}
