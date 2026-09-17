import React from 'react';
import { CategoryDef } from '../types';
import { CategoryContext } from '../utils/tournamentEngine';
import { MatchCard } from './MatchCard';
import { RulesAccordion } from './RulesAccordion';
import { ChampionPodium } from './ChampionPodium';
import { Users, Table, Trophy } from 'lucide-react';

interface RoundRobinViewProps {
  category: CategoryDef;
  context: CategoryContext;
  isVenueMode?: boolean;
  onEditMatch?: (matchId: string) => void;
}

export const RoundRobinView: React.FC<RoundRobinViewProps> = ({
  category,
  context,
  isVenueMode,
  onEditMatch,
}) => {
  const groups = category.groups || [];

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-wide">
            {category.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#9ba498] mt-0.5">
            {category.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
            {category.chip}
          </span>
        </div>
      </div>

      {/* Rules Accordion */}
      <RulesAccordion
        id={category.id}
        formatBullets={category.rulesFormat}
        generalBullets={category.rulesGeneral}
        chip={category.chip}
      />

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => {
          const standings = context.groupStandings[group.id] || [];

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-white/10 bg-[#0a0d0a] overflow-hidden shadow-lg flex flex-col"
            >
              {/* Group Title */}
              <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-heading font-bold text-sm px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-black" />
                  <span>{group.name}</span>
                </div>
                <span className="text-xs font-mono-code bg-black/15 px-2 py-0.5 rounded-full text-black">
                  {group.teams.length} Teams
                </span>
              </div>

              {/* Group Matches */}
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Group Matches</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {group.matches.map((mDef) => {
                    // find resolved match in context or construct display
                    const roundMatch = context.resolvedRounds
                      .flatMap((r) => r.matches)
                      .find((rm) => rm.id === mDef.id);

                    const matchToRender = roundMatch || {
                      id: mDef.id,
                      a: { name: mDef.a, kind: 'fixed' as const },
                      b: { name: mDef.b, kind: 'fixed' as const },
                      isComplete: false,
                    };

                    return (
                      <MatchCard
                        key={mDef.id}
                        match={matchToRender}
                        isVenueMode={isVenueMode}
                        onEditMatch={onEditMatch}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Live Standings Table */}
              <div className="p-4 bg-[#070907] flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2.5">
                  <Table className="w-3.5 h-3.5" />
                  <span>Live Group Standings</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/15 text-[#9ba498] text-[11px] uppercase tracking-wider">
                        <th className="py-2 px-2.5 font-semibold">#</th>
                        <th className="py-2 px-2.5 font-semibold">Team</th>
                        <th className="py-2 px-2 text-center font-semibold">P</th>
                        <th className="py-2 px-2 text-center font-semibold text-emerald-400">W</th>
                        <th className="py-2 px-2 text-center font-semibold text-rose-400">L</th>
                        <th className="py-2 px-2 text-center font-semibold">PF</th>
                        <th className="py-2 px-2 text-center font-semibold">PA</th>
                        <th className="py-2 px-2.5 text-right font-semibold">Diff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono-code text-[12px]">
                      {standings.map((st, idx) => {
                        const isQualifying =
                          category.id === 'boys-doubles' ? idx < 2 : idx === 0;
                        const isLeader = idx === 0 && st.w > 0;

                        return (
                          <tr
                            key={st.name}
                            className={`transition-colors ${
                              isLeader
                                ? 'bg-emerald-950/30 text-emerald-300 font-semibold'
                                : isQualifying && st.w > 0
                                ? 'bg-amber-500/10 text-amber-200'
                                : 'hover:bg-white/[0.02] text-white/90'
                            }`}
                          >
                            <td className="py-2 px-2.5 font-bold font-heading text-sm">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-sans font-medium text-xs sm:text-[13px] truncate max-w-[140px] sm:max-w-[200px]">
                              {st.name}
                              {isLeader && (
                                <span className="ml-1.5 inline-block text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-sans uppercase">
                                  Top 1
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-white/70">{st.p}</td>
                            <td className="py-2 px-2 text-center font-bold text-emerald-400">
                              {st.w}
                            </td>
                            <td className="py-2 px-2 text-center text-rose-400">{st.l}</td>
                            <td className="py-2 px-2 text-center text-white/60">{st.pf}</td>
                            <td className="py-2 px-2 text-center text-white/60">{st.pa}</td>
                            <td
                              className={`py-2 px-2.5 text-right font-bold ${
                                st.diff > 0
                                  ? 'text-emerald-400'
                                  : st.diff < 0
                                  ? 'text-rose-400'
                                  : 'text-white/40'
                              }`}
                            >
                              {st.diff > 0 ? `+${st.diff}` : st.diff}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finals Block (Automatically seeded from Round Robin winners/rankings) */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-heading font-bold text-white tracking-wide">
            Final Championship Playoff
          </h3>
          <span className="text-xs text-[#9ba498]">
            (Auto-populated from Round Robin group standings)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {context.resolvedRounds
            .flatMap((r) => r.matches)
            .filter((m) => /final|playoff/i.test(m.id))
            .map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                isVenueMode={isVenueMode}
                onEditMatch={onEditMatch}
              />
            ))}
        </div>
      </div>

      {/* Champion Podium */}
      <ChampionPodium
        champion={context.champion}
        runnerUp={context.runnerUp}
        thirdPlace={context.thirdPlace}
      />
    </div>
  );
};
