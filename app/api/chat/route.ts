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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const guest = GUESTS.find((g) => g.id === args.guestId);
  const topic = getTopicById(args.topicId);
  if (!guest) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const historyText = args.history
    .slice(-14)
    .map((h) => `${h.name}: ${h.text}`)
    .join('\n');

  const system = `You are ${guest.name} in a multi-person PM office-hours group chat.

Persona context:
- Bio: ${guest.bio}
- Context: ${guest.context}
- Voice anchor: ${guest.story}

Rules:
- Keep reply to 2-4 concise sentences.
- Sound human and specific, not generic.
- React to the latest message and the conversation context.
- Give practical advice with one concrete next step.
- No bullet lists. No markdown.
- Do not repeat wording from earlier replies.
- Stay grounded in ${topic.title}.`;

  const user = `Topic: ${topic.title}
Latest message from user: ${args.userMessage}

Recent chat:
${historyText}

Grounding snippet (if useful):
${args.groundedText ?? 'N/A'}

If the grounding snippet is relevant, weave it naturally. If not, still answer in persona.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
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
