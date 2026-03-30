import { Topic } from '@/lib/topics';

export default function TopicCard({ topic, onClick }: { topic: Topic; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card w-full p-5 text-left transition hover:border-blue-400/50 hover:bg-white/5"
    >
      <p className="text-base font-semibold">{topic.title}</p>
      <p className="mt-2 text-sm text-white/70">{topic.description}</p>
    </button>
  );
}
