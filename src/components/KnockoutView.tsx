import React from 'react';
import { CategoryDef } from '../types';
import { CategoryContext } from '../utils/tournamentEngine';
import { MatchCard } from './MatchCard';
import { RulesAccordion } from './RulesAccordion';
import { ChampionPodium } from './ChampionPodium';

interface KnockoutViewProps {
  category: CategoryDef;
  context: CategoryContext;
  isVenueMode?: boolean;
  onEditMatch?: (matchId: string) => void;
}

export const KnockoutView: React.FC<KnockoutViewProps> = ({
  category,
  context,
  isVenueMode,
  onEditMatch,
}) => {
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

      {/* Bracket Columns Scroll Container */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            {context.resolvedRounds.map((round, rIdx) => (
              <div
                key={rIdx}
                className="w-[280px] sm:w-[300px] flex-shrink-0 flex flex-col"
              >
                {/* Round Title banner */}
                <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-heading font-bold uppercase tracking-wider text-xs px-3.5 py-2 rounded-t-xl shadow-sm flex items-center justify-between">
                  <span>{round.name}</span>
                  <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono-code font-normal text-black">
                    {round.matches.length} {round.matches.length === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>

                {/* Round Matches Container */}
                <div className="p-3 bg-[#080a08] border border-white/10 border-t-0 rounded-b-xl flex flex-col gap-3.5 flex-1 shadow-md">
                  {round.byeNote && (
                    <div className="text-[11px] font-semibold text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg text-center">
                      {round.byeNote}
                    </div>
                  )}
                  {round.matches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      isVenueMode={isVenueMode}
                      onEditMatch={onEditMatch}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
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
