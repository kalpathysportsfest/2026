import React from 'react';
import { Check, Edit3, Circle } from 'lucide-react';
import { ResolvedMatch } from '../types';

interface MatchCardProps {
  match: ResolvedMatch;
  isVenueMode?: boolean;
  onEditMatch?: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isVenueMode,
  onEditMatch,
}) => {
  const { id, a, b, score, winner, byeNote } = match;
  const isAWin = winner && winner.name === a.name;
  const isBWin = winner && winner.name === b.name;

  const sets = score?.sets || [];

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden relative ${
        isVenueMode
          ? 'cursor-pointer hover:border-amber-400/80 hover:shadow-lg hover:shadow-amber-500/10'
          : ''
      } ${
        match.isComplete
          ? 'bg-[#111411] border-white/15 shadow-sm'
          : 'bg-[#0d100d] border-white/10'
      }`}
      onClick={() => isVenueMode && onEditMatch?.(id)}
    >
      {/* Header bar: Match ID & Status */}
      <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-amber-400 tracking-wider">
            {id}
          </span>
          {score?.status === 'walkover' && (
            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[10px] font-semibold">
              W/O
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isVenueMode && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400/80 font-medium">
              <Edit3 className="w-2.5 h-2.5" />
              <span>Edit</span>
            </span>
          )}
          {match.isComplete ? (
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Done
            </span>
          ) : (
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <Circle className="w-1.5 h-1.5" />
              Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Side A */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between gap-2 border-b border-white/5 transition-colors ${
          isAWin
            ? 'bg-emerald-950/40 text-emerald-300 font-semibold'
            : isBWin
            ? 'opacity-60 text-[#f6f3ea]/80'
            : 'text-[#f6f3ea]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
              isAWin
                ? 'bg-emerald-500 border-emerald-400 text-white'
                : 'border-white/20'
            }`}
          >
            {isAWin && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          <span
            className={`text-xs sm:text-[13px] truncate ${
              a.kind === 'pending' ? 'text-white/40 italic' : ''
            }`}
            title={a.name}
          >
            {a.name}
          </span>
        </div>

        {/* Set scores for Side A */}
        <div className="flex items-center gap-1.5 flex-shrink-0 font-mono-code text-xs">
          {sets.length > 0 ? (
            sets.map(([sA], idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded text-center min-w-[20px] ${
                  isAWin
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'bg-white/5 text-white/80'
                }`}
              >
                {sA}
              </span>
            ))
          ) : (
            <span className="text-white/20 text-[10px]">-</span>
          )}
        </div>
      </div>

      {/* Side B */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between gap-2 transition-colors ${
          isBWin
            ? 'bg-emerald-950/40 text-emerald-300 font-semibold'
            : isAWin
            ? 'opacity-60 text-[#f6f3ea]/80'
            : 'text-[#f6f3ea]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
              isBWin
                ? 'bg-emerald-500 border-emerald-400 text-white'
                : 'border-white/20'
            }`}
          >
            {isBWin && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          <span
            className={`text-xs sm:text-[13px] truncate ${
              b.kind === 'pending' ? 'text-white/40 italic' : ''
            }`}
            title={b.name}
          >
            {b.name}
          </span>
        </div>

        {/* Set scores for Side B */}
        <div className="flex items-center gap-1.5 flex-shrink-0 font-mono-code text-xs">
          {sets.length > 0 ? (
            sets.map(([, sB], idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded text-center min-w-[20px] ${
                  isBWin
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'bg-white/5 text-white/80'
                }`}
              >
                {sB}
              </span>
            ))
          ) : (
            <span className="text-white/20 text-[10px]">-</span>
          )}
        </div>
      </div>

      {/* Bye note */}
      {byeNote && (
        <div className="px-3 py-1 bg-amber-500/10 text-amber-300 text-[11px] font-medium border-t border-amber-500/20">
          {byeNote}
        </div>
      )}
    </div>
  );
};
