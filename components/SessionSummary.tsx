type SummaryProps = {
  topic: string;
  quotes: { guest: string; quote: string }[];
  actions: string[];
  onClose: () => void;
};

export default function SessionSummary({ topic, quotes, actions, onClose }: SummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-2xl p-6">
        <h3 className="text-xl font-bold">Session Summary</h3>
        <p className="mt-1 text-sm text-white/70">Topic: {topic}</p>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Key quotes</p>
          {quotes.map((q) => (
            <div key={q.guest} className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-white/60">{q.guest}</p>
              <p className="text-sm">“{q.quote}”</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-semibold">3 things to try this week</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/85">
            {actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copy link
          </button>
          <button className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
