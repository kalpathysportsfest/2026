import {
  CategoryDef,
  GroupDef,
  GroupStanding,
  MatchDef,
  MatchScoreEntry,
  MatchSideRef,
  ResolvedMatch,
  ResolvedSide,
} from '../types';

export interface CategoryContext {
  winners: Record<string, string>;
  losers: Record<string, string>;
  groupStandings: Record<string, GroupStanding[]>;
  groupRankings: Record<string, string[]>;
  resolvedRounds: {
    name: string;
    byeNote?: string;
    matches: ResolvedMatch[];
  }[];
  champion?: string;
  runnerUp?: string;
  thirdPlace?: string;
}

export function resolveSide(
  side: MatchSideRef,
  ctx: {
    winners: Record<string, string>;
    losers: Record<string, string>;
    groupRankings: Record<string, string[]>;
  }
): ResolvedSide {
  if (typeof side === 'string') {
    return { name: side, kind: 'fixed' };
  }
  if ('p' in side && side.p) {
    return { name: side.p, kind: 'fixed' };
  }
  if ('group' in side && side.group) {
    const rank = side.rank ? side.rank - 1 : 0;
    const ranked = ctx.groupRankings[side.group];
    if (ranked && ranked[rank]) {
      return { name: ranked[rank], kind: 'resolved' };
    }
    const label = side.rank && side.rank > 1 ? `Rank #${side.rank} (${side.group})` : `Winner ${side.group}`;
    return { name: label, kind: 'pending' };
  }
  if ('ref' in side && side.ref) {
    const name = side.loser ? ctx.losers[side.ref] : ctx.winners[side.ref];
    if (name) {
      return { name, kind: 'resolved' };
    }
    const prefix = side.loser ? 'Loser ' : 'Winner ';
    return { name: prefix + side.ref, kind: 'pending' };
  }
  return { name: 'TBD', kind: 'pending' };
}

/**
 * Determines whether a set is finished and who won it based on badminton rules
 */
export function evaluateSet(scoreA: number, scoreB: number, target: number, cap: number): 'A' | 'B' | null {
  if (scoreA >= cap && scoreA > scoreB) return 'A';
  if (scoreB >= cap && scoreB > scoreA) return 'B';
  if (scoreA >= target && scoreA - scoreB >= 2) return 'A';
  if (scoreB >= target && scoreB - scoreA >= 2) return 'B';
  return null;
}

/**
 * Computes match winner from set scores or explicit winner field
 */
export function determineMatchWinner(
  scoreEntry: MatchScoreEntry | undefined,
  targetScore: number,
  capScore: number,
  bestOf: number
): { winner: 'A' | 'B' | null; isComplete: boolean } {
  if (!scoreEntry) return { winner: null, isComplete: false };

  // Manual or Walkover override
  if (scoreEntry.winner === 'A' || scoreEntry.winner === 'B') {
    return { winner: scoreEntry.winner, isComplete: true };
  }

  if (!scoreEntry.sets || scoreEntry.sets.length === 0) {
    return { winner: null, isComplete: false };
  }

  let winsA = 0;
  let winsB = 0;
  const neededWins = bestOf === 3 ? 2 : 1;

  for (const [sA, sB] of scoreEntry.sets) {
    const setWinner = evaluateSet(sA, sB, targetScore, capScore);
    if (setWinner === 'A') winsA++;
    if (setWinner === 'B') winsB++;

    if (winsA >= neededWins) return { winner: 'A', isComplete: true };
    if (winsB >= neededWins) return { winner: 'B', isComplete: true };
  }

  // If score is simply recorded as a single set with higher score (e.g. 15-11)
  if (scoreEntry.sets.length === 1) {
    const [sA, sB] = scoreEntry.sets[0];
    if (sA > sB && sA >= targetScore) return { winner: 'A', isComplete: true };
    if (sB > sA && sB >= targetScore) return { winner: 'B', isComplete: true };
  }

  return { winner: null, isComplete: false };
}

export function computeGroupStandings(
  group: GroupDef,
  scores: Record<string, MatchScoreEntry>,
  targetScore: number = 15,
  capScore: number = 17
): GroupStanding[] {
  const stats: Record<string, GroupStanding> = {};

  group.teams.forEach((t) => {
    stats[t] = { name: t, p: 0, w: 0, l: 0, pf: 0, pa: 0, diff: 0 };
  });

  group.matches.forEach((m) => {
    const entry = scores[m.id];
    if (!entry) return;

    let ptsA = 0;
    let ptsB = 0;
    let matchWinner: 'A' | 'B' | null = null;

    if (entry.sets && entry.sets.length > 0) {
      entry.sets.forEach(([sA, sB]) => {
        ptsA += sA || 0;
        ptsB += sB || 0;
      });
      const res = determineMatchWinner(entry, targetScore, capScore, 1);
      matchWinner = res.winner;
    } else if (entry.winner) {
      matchWinner = entry.winner as 'A' | 'B';
    }

    if (matchWinner && stats[m.a] && stats[m.b]) {
      stats[m.a].p += 1;
      stats[m.b].p += 1;
      stats[m.a].pf += ptsA;
      stats[m.a].pa += ptsB;
      stats[m.b].pf += ptsB;
      stats[m.b].pa += ptsA;

      if (matchWinner === 'A') {
        stats[m.a].w += 1;
        stats[m.b].l += 1;
      } else {
        stats[m.b].w += 1;
        stats[m.a].l += 1;
      }
    }
  });

  const list = Object.values(stats).map((s) => ({
    ...s,
    diff: s.pf - s.pa,
  }));

  // Sort by Wins desc, then Point Differential desc, then Points For desc
  list.sort((x, y) => y.w - x.w || y.diff - x.diff || y.pf - x.pf);

  return list;
}

export function computeCategoryContext(
  cat: CategoryDef,
  scores: Record<string, MatchScoreEntry>
): CategoryContext {
  const winners: Record<string, string> = {};
  const losers: Record<string, string> = {};
  const groupStandings: Record<string, GroupStanding[]> = {};
  const groupRankings: Record<string, string[]> = {};

  // 1. Process groups if round-robin
  if (cat.groups) {
    cat.groups.forEach((g) => {
      const st = computeGroupStandings(g, scores, cat.targetScore, cat.capScore);
      groupStandings[g.id] = st;
      groupRankings[g.id] = st.map((item) => item.name);
    });
  }

  const resolveCtx = { winners, losers, groupRankings };

  // 2. Process rounds in order
  const resolvedRounds = cat.rounds.map((round) => {
    // Check if round requires best-of-3 (e.g. from SF onwards in certain draws)
    const isLateRound =
      /semi|final|3rd/i.test(round.name) ||
      (cat.bestOf === 3 && round.matches.length > 0);
    const roundBestOf = isLateRound ? Math.max(cat.bestOf, 3) : cat.bestOf;

    const matches: ResolvedMatch[] = round.matches.map((m: MatchDef) => {
      const sideA = resolveSide(m.a, resolveCtx);
      const sideB = resolveSide(m.b, resolveCtx);
      const scoreEntry = scores[m.id];

      const { winner: winKey, isComplete } = determineMatchWinner(
        scoreEntry,
        cat.targetScore,
        cat.capScore,
        roundBestOf
      );

      let winner: ResolvedSide | undefined;
      let loser: ResolvedSide | undefined;

      if (winKey === 'A' && sideA.kind !== 'pending') {
        winner = sideA;
        loser = sideB;
        winners[m.id] = sideA.name;
        losers[m.id] = sideB.name;
      } else if (winKey === 'B' && sideB.kind !== 'pending') {
        winner = sideB;
        loser = sideA;
        winners[m.id] = sideB.name;
        losers[m.id] = sideA.name;
      }

      return {
        id: m.id,
        a: sideA,
        b: sideB,
        score: scoreEntry,
        winner,
        loser,
        isComplete,
        byeNote: m.byeNote,
      };
    });

    return {
      name: round.name,
      byeNote: round.byeNote,
      matches,
    };
  });

  // 3. Determine Champion & Podium
  let champion: string | undefined;
  let runnerUp: string | undefined;
  let thirdPlace: string | undefined;

  const allResolvedMatches = resolvedRounds.flatMap((r) => r.matches);
  const finalMatch = allResolvedMatches.find(
    (m) => /final/i.test(m.id) && !/3rd/i.test(m.id)
  );
  const thirdMatch = allResolvedMatches.find((m) => /3rd/i.test(m.id));

  if (finalMatch && finalMatch.winner) {
    champion = finalMatch.winner.name;
    if (finalMatch.loser && finalMatch.loser.kind !== 'pending') {
      runnerUp = finalMatch.loser.name;
    }
  }

  if (thirdMatch && thirdMatch.winner) {
    thirdPlace = thirdMatch.winner.name;
  }

  return {
    winners,
    losers,
    groupStandings,
    groupRankings,
    resolvedRounds,
    champion,
    runnerUp,
    thirdPlace,
  };
}
