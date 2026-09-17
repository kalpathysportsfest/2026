export type MatchSideRef =
  | string
  | { p: string }
  | { group: string; rank?: number }
  | { ref: string; loser?: boolean };

export interface MatchDef {
  id: string;
  a: MatchSideRef;
  b: MatchSideRef;
  court?: string;
  time?: string;
  byeNote?: string;
}

export interface RoundDef {
  name: string;
  matches: MatchDef[];
  byeNote?: string;
}

export interface GroupDef {
  id: string;
  name: string;
  teams: string[];
  matches: { id: string; a: string; b: string }[];
}

export interface CategoryDef {
  id: string;
  name: string;
  subtitle: string;
  chip: string;
  type: 'knockout' | 'roundrobin';
  targetScore: number;
  capScore: number;
  bestOf: number;
  rulesFormat: string[];
  rulesGeneral: string[];
  groups?: GroupDef[];
  rounds: RoundDef[];
}

export interface MatchScoreEntry {
  sets?: [number, number][];
  winner?: 'A' | 'B' | string;
  status?: 'pending' | 'in-progress' | 'completed' | 'walkover';
  note?: string;
}

export interface TournamentScoresFile {
  updatedAt: string;
  tournament: string;
  version?: string;
  scores: Record<string, MatchScoreEntry>;
}

export interface ResolvedSide {
  name: string;
  kind: 'fixed' | 'resolved' | 'pending';
}

export interface ResolvedMatch {
  id: string;
  a: ResolvedSide;
  b: ResolvedSide;
  score?: MatchScoreEntry;
  winner?: ResolvedSide;
  loser?: ResolvedSide;
  isComplete: boolean;
  byeNote?: string;
}

export interface GroupStanding {
  name: string;
  p: number;
  w: number;
  l: number;
  pf: number;
  pa: number;
  diff: number;
}
