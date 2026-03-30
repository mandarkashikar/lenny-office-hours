'use client';

import { useRouter } from 'next/navigation';
import TopicCard from '@/components/TopicCard';
import { TOPICS } from '@/lib/topics';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Lenny&apos;s Office Hours</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Office hours with the best PMs in the world</h1>
        <p className="mt-3 text-sm text-white/70 sm:text-base">Pick a topic. Pick your guests. Learn by doing.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOPICS.map((topic) => (
          <TopicCard key={topic.id} topic={topic} onClick={() => router.push(`/session?topic=${topic.id}`)} />
        ))}
      </div>
    </main>
  );
}
