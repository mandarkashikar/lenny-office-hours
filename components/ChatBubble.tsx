'use client';

import { useState } from 'react';

type BubbleProps = {
  name: string;
  text: string;
  color?: string;
  mine?: boolean;
  avatar?: string;
  context?: string;
  episodeUrl?: string | null;
  timestamp?: string;
};

export default function ChatBubble({ name, text, color = '#9ca3af', mine = false, avatar, context, episodeUrl, timestamp }: BubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${text}"\n— ${name}, Lenny's Office Hours`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (mine) {
    return (
      <div className="mb-3 flex flex-col items-end gap-0.5">
        <div className="max-w-[82%] rounded-[22px] rounded-br-md bg-[#0A84FF] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_4px_14px_rgba(10,132,255,0.35)]">
          {text}
        </div>
        {timestamp && <span className="text-[10px] text-white/30">{timestamp}</span>}
      </div>
    );
  }

  return (
    <div className="group mb-4 flex gap-2.5">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold uppercase"
        style={{ backgroundColor: `${color}2E`, color }}
      >
        {avatar ??
          name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
      </div>

      <div className="max-w-[82%]">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="text-[11px] font-medium tracking-wide" style={{ color }}>
            {name}
          </p>
          {timestamp && <span className="text-[10px] text-white/30">{timestamp}</span>}
        </div>
        {context ? <p className="mb-1 text-[10px] text-white/45">{context}</p> : null}
        <div className="relative rounded-[18px] rounded-bl-md border border-white/10 bg-[#22252a] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
          {text}
          {episodeUrl && (
            <a
              href={episodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
            >
              <span>▶</span>
              <span>Watch the full episode on Lenny's Podcast</span>
            </a>
          )}
          <button
            onClick={handleCopy}
            className="absolute -right-1 -top-1 hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/20 hover:text-white group-hover:block"
          >
            {copied ? 'Copied!' : 'Copy quote'}
          </button>
        </div>
      </div>
    </div>
  );
}
