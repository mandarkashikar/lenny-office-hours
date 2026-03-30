import { Guest } from '@/lib/topics';

type Props = {
  guest: Guest;
  selected: boolean;
  onToggle: () => void;
  mode?: 'checkbox' | 'radio';
};

export default function GuestCard({ guest, selected, onToggle, mode = 'checkbox' }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`card w-full p-4 text-left transition ${selected ? 'bg-white/5' : 'hover:border-white/30'}`}
      style={selected ? { borderColor: guest.color, borderLeftWidth: '3px' } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: `${guest.color}33`, color: guest.color }}
          >
            {guest.avatar}
          </div>
          <div>
            <p className="font-semibold">{guest.name}</p>
            <p className="text-xs text-white/70">{guest.bio}</p>
            <p className="text-[10px] text-white/45">{guest.context}</p>
          </div>
        </div>

        <div
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center border ${
            mode === 'radio' ? 'rounded-full' : 'rounded'
          }`}
          style={selected ? { borderColor: guest.color, backgroundColor: `${guest.color}CC`, color: 'white' } : { borderColor: 'rgba(255,255,255,0.3)', color: 'transparent' }}
        >
          ✓
        </div>
      </div>
    </button>
  );
}
