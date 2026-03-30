'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GuestCard from '@/components/GuestCard';
import ChatBubble from '@/components/ChatBubble';
import TypingIndicator from '@/components/TypingIndicator';
import SessionSummary from '@/components/SessionSummary';
import { SUMMARY_ACTIONS } from '@/lib/content';
import { guestsForTopic, getTopicById, GUESTS } from '@/lib/topics';

type Msg = {
  id: string;
  guestId?: string;
  name: string;
  text: string;
  mine?: boolean;
  episodeUrl?: string | null;
  timestamp?: string;
};

type ChatHistoryItem = { name: string; text: string; guestId?: string; mine?: boolean };
type SessionPhase = 'opening' | 'deepening' | 'hotseat' | 'synthesis';

function nowHHMM() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const LENNY_OPENERS: Record<string, string> = {
  'product-discovery': "What does discovery actually look like in your org — let's find out.",
  'customer-interviewing': "Most teams think they do customer interviews. Very few do them well.",
  'prioritization': "Everyone has a framework. Almost no one sticks to it under pressure.",
  'roadmapping': "A roadmap is a hypothesis, not a promise. Let's talk about the difference.",
  'engineering-collaboration': "The best product orgs treat engineering as a discovery partner, not a delivery service.",
  'metrics-and-success': "Measuring the wrong thing confidently is worse than measuring nothing.",
  'killing-features': "Cutting scope is a skill. Most teams never learn it.",
};

const LENNY_SYNTHESES = [
  (name: string, quote: string) => `Strong point from ${name}: "${quote.slice(0, 70)}…" — worth sitting with. What does that mean for your actual situation?`,
  (_: string, quote: string) => `I'm noticing a pattern here: "${quote.slice(0, 60)}…" — what's the blockers that have stopped you from trying this?`,
  (name: string) => `${name} is pointing at something most people skip over. Let me ask you directly: what have you tried so far?`,
  () => `Two different mental models on the table. Which one maps closer to where your team is right now?`,
  () => `I want to push back gently — the theory is clear. What's the hardest part of doing this inside your actual org?`,
  () => `We're hitting the real tension: knowing what to do vs. having the org support to do it. Let's dig into that.`,
];

const CROSS_TALK_TEMPLATES = [
  (g1: string, g2: string, quote: string) => `${g1} is right that "${quote.slice(0, 55)}…" — and I'd add the part that usually breaks this in practice is org alignment, not the framework itself.`,
  (g1: string, _: string, quote: string) => `I'd push back slightly on ${g1}: "${quote.slice(0, 55)}…" — that framing works at scale but can mislead smaller teams into over-engineering their process.`,
  (g1: string) => `${g1} nailed the headline. The footnote that gets missed: this only works if leadership is actually willing to kill things that don't score.`,
  (_: string, g2: string) => `I disagree with ${g2} here. The real bottleneck isn't the framework — it's that teams don't do the emotional work of admitting what isn't working.`,
  (g1: string, _: string, quote: string) => `Extending ${g1}'s point: "${quote.slice(0, 55)}…" — the best signal I've seen is whether engineers are brought in before the solution is already decided.`,
];

const HOTSEAT_QUESTIONS = [
  "Okay, let's get specific — describe your actual current process in one paragraph. No aspirational framing.",
  "What's one decision you've gotten wrong in this area in the last six months? Be specific.",
  "If I asked your engineering lead to describe how product discovery works on your team, what would they say?",
  "What's the thing you know you should be doing differently but haven't changed yet? And why not?",
  "Walk me through the last time you killed something. What happened?",
];

function SessionPageContent() {
  const params = useSearchParams();
  const topicId = params.get('topic') ?? 'product-discovery';
  const topic = getTopicById(topicId);
  const available = guestsForTopic(topicId);

  const defaultHost = available.find((g) => g.id === 'lenny')?.id ?? available[0]?.id ?? 'lenny';

  const [hostId, setHostId] = useState(defaultHost);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [usedGuestReplies, setUsedGuestReplies] = useState<Record<string, string[]>>({});
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('opening');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const usedLennySynthIdx = useRef<number[]>([]);
  const usedHotseatIdx = useRef<number[]>([]);

  const participantIds = useMemo(() => [hostId, ...selectedMembers], [hostId, selectedMembers]);
  const selectedGuests = useMemo(() => GUESTS.filter((g) => participantIds.includes(g.id)), [participantIds]);
  const addableGuests = useMemo(
    () => available.filter((g) => g.id !== hostId && !selectedMembers.includes(g.id)),
    [available, hostId, selectedMembers],
  );

  const rememberGuestReply = (guestId: string, text: string) => {
    if (!text.trim()) return;
    setUsedGuestReplies((prev) => {
      const current = prev[guestId] ?? [];
      if (current.includes(text)) return prev;
      return { ...prev, [guestId]: [...current, text].slice(-20) };
    });
  };

  const phaseFallbackPrefix = (phase: SessionPhase): string => {
    if (phase === 'opening') return 'Great place to start. ';
    if (phase === 'deepening') return 'Going deeper — ';
    if (phase === 'hotseat') return 'Let me be direct: ';
    return 'Pulling it together — ';
  };

  const fallbackReply = (guestId: string, topicName: string, userMessage: string, phase: SessionPhase) => {
    const guest = GUESTS.find((g) => g.id === guestId);
    const topicLabel = topicName.replace(/-/g, ' ');
    const context = guest?.context ?? guest?.bio ?? 'product work';
    const story = guest?.story ?? "I've seen this pattern repeatedly in product orgs.";
    const prefix = phaseFallbackPrefix(phase);

    const templates = [
      `${prefix}${story} For ${topicLabel}, I'd frame this around outcomes first, then test assumptions in smaller, faster loops.`,
      `${prefix}From my ${context} background, the most common mistake is over-planning. Short feedback cycles beat long planning cycles every time.`,
      `${prefix}Given what you shared — "${userMessage.slice(0, 80)}${userMessage.length > 80 ? '…' : ''}" — run one concrete experiment this week and define what evidence would make you change your mind.`,
      `${prefix}A practical move from teams I've coached: align PM, design, and engineering on one hypothesis, then test quickly instead of debating frameworks in the abstract.`,
      `${prefix}One lens from my own operating context: if this doesn't improve customer behavior or business outcomes, it's likely process theater, not discovery.`,
    ];

    const used = usedGuestReplies[guestId] ?? [];
    return templates.find((t) => !used.includes(t)) ?? templates[Math.floor(Math.random() * templates.length)];
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const pushMsg = (msg: Omit<Msg, 'id' | 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID(), timestamp: nowHHMM() }]);
  };

  const pushGuestMessage = async (guestId: string, text: string, episodeUrl?: string | null, delayMs = 700) => {
    const guest = GUESTS.find((g) => g.id === guestId);
    if (!guest) return;
    setTypingName(guest.name);
    await new Promise((r) => setTimeout(r, delayMs));
    setTypingName(null);
    pushMsg({ guestId, name: guest.name, text, episodeUrl });
  };

  const getGroundedResult = async (args: {
    guestId: string;
    topicId: string;
    userMessage?: string;
    fallback: string;
    excludeTexts?: string[];
    history?: ChatHistoryItem[];
  }): Promise<{ text: string; episodeUrl: string | null }> => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (!res.ok) return { text: args.fallback, episodeUrl: null };
      const data = (await res.json()) as { text?: string; episodeUrl?: string | null };
      return { text: data.text?.trim() || args.fallback, episodeUrl: data.episodeUrl ?? null };
    } catch {
      return { text: args.fallback, episodeUrl: null };
    }
  };

  const injectLennySynthesis = async (msgs: Msg[]) => {
    const available_indices = LENNY_SYNTHESES.map((_, i) => i).filter((i) => !usedLennySynthIdx.current.includes(i));
    if (!available_indices.length) return;
    const idx = available_indices[Math.floor(Math.random() * available_indices.length)];
    usedLennySynthIdx.current = [...usedLennySynthIdx.current, idx];

    const lastGuest = [...msgs].reverse().find((m) => m.guestId && m.guestId !== hostId);
    const guest = lastGuest ? GUESTS.find((g) => g.id === lastGuest.guestId) : null;
    const quote = lastGuest?.text ?? '';

    const text = LENNY_SYNTHESES[idx](guest?.name ?? 'That guest', quote);
    await pushGuestMessage(hostId, text, null, 1000);
  };

  const injectCrosstalk = async (mainMsgs: Msg[], respondingIds: string[]) => {
    if (respondingIds.length < 2) return;
    if (Math.random() > 0.4) return; // ~40% chance

    const shuffled = [...respondingIds].sort(() => Math.random() - 0.5);
    const speakerId = shuffled[0];
    const targetId = shuffled[1];
    const targetGuest = GUESTS.find((g) => g.id === targetId);
    const speakerGuest = GUESTS.find((g) => g.id === speakerId);
    if (!targetGuest || !speakerGuest) return;

    const targetLastMsg = [...mainMsgs].reverse().find((m) => m.guestId === targetId);
    if (!targetLastMsg) return;

    const tmpl = CROSS_TALK_TEMPLATES[Math.floor(Math.random() * CROSS_TALK_TEMPLATES.length)];
    const crossText = tmpl(targetGuest.name, speakerGuest.name, targetLastMsg.text);

    await pushGuestMessage(speakerId, crossText, null, 1200);
  };

  const injectHotseat = async () => {
    const available_indices = HOTSEAT_QUESTIONS.map((_, i) => i).filter((i) => !usedHotseatIdx.current.includes(i));
    if (!available_indices.length) return;
    const idx = available_indices[Math.floor(Math.random() * available_indices.length)];
    usedHotseatIdx.current = [...usedHotseatIdx.current, idx];

    const askerId = participantIds[Math.floor(Math.random() * participantIds.length)];
    await pushGuestMessage(askerId, HOTSEAT_QUESTIONS[idx], null, 1500);
  };

  const startSession = () => {
    if (selectedMembers.length < 1) return;
    setStarted(true);
    const opener = LENNY_OPENERS[topicId] ?? "Welcome. What are you working on?";
    pushMsg({ guestId: hostId, name: GUESTS.find((g) => g.id === hostId)?.name ?? 'Host', text: opener });
  };

  const sendUserMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    const nextCount = userMessageCount + 1;
    setUserMessageCount(nextCount);

    let newPhase: SessionPhase = sessionPhase;
    if (nextCount <= 2) newPhase = 'opening';
    else if (nextCount <= 5) newPhase = 'deepening';
    else newPhase = 'hotseat';
    setSessionPhase(newPhase);

    pushMsg({ name: 'You', text, mine: true });

    const guestIds = participantIds.filter((id) => id !== hostId).slice(0, 4);
    let rollingHistory: ChatHistoryItem[] = [...messages].slice(-14).map((m) => ({
      name: m.name, text: m.text, guestId: m.guestId, mine: m.mine,
    }));

    const newMsgs: Msg[] = [];

    for (const guestId of guestIds) {
      const fallback = fallbackReply(guestId, topicId, text, newPhase);
      const result = await getGroundedResult({
        guestId, topicId, userMessage: text, fallback,
        excludeTexts: usedGuestReplies[guestId] ?? [],
        history: rollingHistory,
      });
      rememberGuestReply(guestId, result.text);

      const guest = GUESTS.find((g) => g.id === guestId);
      const msg: Msg = { id: crypto.randomUUID(), guestId, name: guest?.name ?? guestId, text: result.text, episodeUrl: result.episodeUrl, timestamp: nowHHMM() };
      newMsgs.push(msg);
      setTypingName(guest?.name ?? null);
      await new Promise((r) => setTimeout(r, 700));
      setTypingName(null);
      setMessages((prev) => [...prev, msg]);
      rollingHistory = [...rollingHistory, { name: msg.name, text: msg.text, guestId }].slice(-14);
    }

    // Cross-talk between guests (occasional)
    await injectCrosstalk([...messages, ...newMsgs], guestIds);

    // Lenny synthesis every 2 user messages
    if (nextCount % 2 === 0) {
      await injectLennySynthesis([...messages, ...newMsgs]);
    }

    // Hotseat at phase transition
    if (newPhase === 'hotseat' && sessionPhase !== 'hotseat') {
      await injectHotseat();
    }
  };

  const addGuestToLiveChat = async (guestId: string) => {
    if (guestId === hostId || selectedMembers.includes(guestId)) return;
    setSelectedMembers((prev) => [...prev, guestId].slice(0, 5));
    setShowAddGuest(false);
    if (!started) return;

    const latestUserMessage = [...messages].reverse().find((m) => m.mine)?.text ?? '';
    const fallback = `${GUESTS.find((g) => g.id === guestId)?.story ?? 'Jumping in.'} Catching up — here's where I'd focus first.`;
    const result = await getGroundedResult({
      guestId, topicId, userMessage: latestUserMessage, fallback,
      excludeTexts: usedGuestReplies[guestId] ?? [],
      history: messages.slice(-12).map((m) => ({ name: m.name, text: m.text, guestId: m.guestId, mine: m.mine })),
    });
    rememberGuestReply(guestId, result.text);
    await pushGuestMessage(guestId, result.text, result.episodeUrl);
  };

  const handleEndSession = async () => {
    // Synthesis moment — Lenny wraps up
    const lastUserMsg = [...messages].reverse().find((m) => m.mine);
    if (lastUserMsg) {
      const lastGuestMsg = [...messages].reverse().find((m) => m.guestId && !m.mine);
      const guestName = GUESTS.find((g) => g.id === lastGuestMsg?.guestId)?.name ?? 'the panel';
      const synthText = `Before we wrap — the thread I'd pull on most from today: what ${guestName} said about "${(lastGuestMsg?.text ?? '').slice(0, 60)}…". That's the one to act on this week.`;
      await pushGuestMessage(hostId, synthText, null, 800);
    }
    setShowSummary(true);
  };

  if (!started) {
    const totalSelected = 1 + selectedMembers.length;
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">{topic.title}</h1>
        <p className="mt-2 text-sm text-white/70">Pick 1 host and 1–5 guests for your group chat.</p>

        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/60">Host (pick one)</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {available.map((guest) => (
              <GuestCard
                key={`host-${guest.id}`}
                guest={guest}
                selected={hostId === guest.id}
                mode="radio"
                onToggle={() => {
                  setHostId(guest.id);
                  setSelectedMembers((prev) => prev.filter((id) => id !== guest.id));
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/60">Members (pick up to 5)</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {available.filter((guest) => guest.id !== hostId).map((guest) => (
              <GuestCard
                key={`member-${guest.id}`}
                guest={guest}
                selected={selectedMembers.includes(guest.id)}
                mode="checkbox"
                onToggle={() => toggleMember(guest.id)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={selectedMembers.length < 1}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Session ({totalSelected} selected)
        </button>
      </main>
    );
  }

  const quoteMap = selectedGuests.map((g) => {
    const first = messages.find((m) => m.guestId === g.id && !m.mine);
    return { guest: g.name, quote: first?.text ?? 'No quote captured.' };
  });

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-4 p-3 md:grid-cols-[280px_1fr] md:p-6">
      <aside className="card h-fit p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Session Topic</p>
        <h2 className="mt-2 text-lg font-semibold">{topic.title}</h2>
        <div className="mt-1 text-xs text-white/50">{selectedGuests.length} participants</div>

        <div className="mt-4 space-y-2">
          {selectedGuests.map((g) => (
            <div key={g.id} className="flex items-start gap-2 text-sm">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                style={{ backgroundColor: `${g.color}33`, color: g.color }}>
                {g.avatar}
              </div>
              <div>
                <div>{g.name}</div>
                <div className="text-[10px] text-white/45">{g.context}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded px-2 py-1 text-[10px] text-white/40">
          Phase: <span className="font-medium text-white/60 capitalize">{sessionPhase}</span>
        </div>

        <button onClick={handleEndSession}
          className="mt-5 w-full rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5">
          End Session
        </button>
      </aside>

      <section className="card flex min-h-[82vh] flex-col overflow-hidden border-white/15 bg-[#111317]">
        <div className="border-b border-white/10 bg-[#1a1d23] px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Group Chat</p>
              <p className="text-sm font-semibold">Lenny's Office Hours — {topic.title}</p>
            </div>
            <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">{selectedGuests.length} in room</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#161920] p-4 sm:p-6">
          {messages.map((m) => {
            const guest = GUESTS.find((g) => g.id === m.guestId);
            return (
              <ChatBubble
                key={m.id}
                name={m.name}
                text={m.text}
                mine={m.mine}
                color={guest?.color}
                avatar={guest?.avatar}
                context={guest?.context}
                episodeUrl={m.episodeUrl}
                timestamp={m.timestamp}
              />
            );
          })}
          {typingName && <TypingIndicator name={typingName} />}
        </div>

        <div className="border-t border-white/10 bg-[#1a1d23] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddGuest(true)}
              className="shrink-0 rounded-full border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              + Add guest
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 280))}
              onKeyDown={(e) => e.key === 'Enter' && sendUserMessage()}
              placeholder="Message the panel…"
              className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            />
            <button onClick={sendUserMessage}
              className="rounded-full bg-[#0A84FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2b95ff]">
              Send
            </button>
          </div>
          <p className="mt-1 text-right text-xs text-white/40">{input.length}/280</p>
        </div>
      </section>

      {showAddGuest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Add a guest</h3>
              <button onClick={() => setShowAddGuest(false)} className="text-sm text-white/60 hover:text-white">Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {addableGuests.length ? (
                addableGuests.map((guest) => (
                  <GuestCard key={`add-${guest.id}`} guest={guest} selected={false} mode="checkbox"
                    onToggle={() => addGuestToLiveChat(guest.id)} />
                ))
              ) : (
                <div className="text-sm text-white/60">No additional guests available for this topic.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <SessionSummary
          topic={topic.title}
          quotes={quoteMap}
          actions={SUMMARY_ACTIONS[topicId] ?? SUMMARY_ACTIONS['product-discovery']}
          onClose={() => setShowSummary(false)}
        />
      )}
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 text-sm text-white/70">Loading session…</main>}>
      <SessionPageContent />
    </Suspense>
  );
}
