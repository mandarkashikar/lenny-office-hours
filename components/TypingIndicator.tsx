export default function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="mb-3 ml-11 inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-[#22252a] px-3 py-2 text-xs text-white/70">
      <span>{name} is typing</span>
      <span className="inline-flex gap-1 align-middle">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:240ms]" />
      </span>
    </div>
  );
}
