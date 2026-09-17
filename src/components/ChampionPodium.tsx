import React from 'react';
import { Trophy, Medal } from 'lucide-react';

interface ChampionPodiumProps {
  champion?: string;
  runnerUp?: string;
  thirdPlace?: string;
}

export const ChampionPodium: React.FC<ChampionPodiumProps> = ({
  champion,
  runnerUp,
  thirdPlace,
}) => {
  if (!champion && !runnerUp && !thirdPlace) return null;

  return (
    <div className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/15 border border-amber-500/30 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3 text-amber-400 font-heading text-lg font-bold">
        <Trophy className="w-5 h-5 text-amber-400" />
        <span>Tournament Podium &amp; Honors</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Champion */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Champion
            </span>
            <span className="text-sm sm:text-base font-semibold text-white truncate block">
              {champion || 'In Progress'}
            </span>
          </div>
        </div>

        {/* Runner-up */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-slate-400/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-400/20 border border-slate-400/40 flex items-center justify-center flex-shrink-0">
            <Medal className="w-5 h-5 text-slate-300" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Runner-Up
            </span>
            <span className="text-sm sm:text-base font-semibold text-white truncate block">
              {runnerUp || 'TBD'}
            </span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-amber-700/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-700/20 border border-amber-700/40 flex items-center justify-center flex-shrink-0">
            <Medal className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              3rd Place
            </span>
            <span className="text-sm sm:text-base font-semibold text-white truncate block">
              {thirdPlace || 'TBD'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
