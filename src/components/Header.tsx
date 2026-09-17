import React from 'react';
import { RefreshCw, Radio, Settings, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { TOURNAMENT_INFO } from '../data/tournamentData';

interface HeaderProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onRefresh: () => void;
  syncSource: 'live' | 'local' | 'error';
  onOpenVenueDeck: () => void;
  onOpenBackendGuide: () => void;
  venueModeActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lastSyncTime,
  isSyncing,
  onRefresh,
  syncSource,
  onOpenVenueDeck,
  onOpenBackendGuide,
  venueModeActive,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#060806] sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Tournament Title */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0d143c] border border-amber-500/30 flex items-center justify-center p-2 flex-shrink-0 shadow-inner">
              <span className="text-3xl select-none" role="img" aria-label="shuttlecock">
                🏸
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                  {TOURNAMENT_INFO.name}
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-white/20"></span>
                <span className="hidden sm:inline-block text-xs text-white/50">
                  {TOURNAMENT_INFO.date}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f6f3ea] font-heading">
                {TOURNAMENT_INFO.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#9ba498]">
                {TOURNAMENT_INFO.subtitle} · File-Based Backend (GitHub Pages)
              </p>
            </div>
          </div>

          {/* Sync & Venue Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Live Sync Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131713] border border-white/10 text-xs font-medium">
              {syncSource === 'live' && (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-semibold">Live Backend</span>
                </>
              )}
              {syncSource === 'local' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-semibold">Local Draft</span>
                </>
              )}
              {syncSource === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 font-semibold">Sync Failed</span>
                </>
              )}
              <span className="text-white/40">|</span>
              <span className="text-white/60 font-mono-code text-[11px]">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending'}
              </span>
              <button
                id="btn-sync-refresh"
                onClick={onRefresh}
                disabled={isSyncing}
                title="Fetch latest scores.json from server with cache-busting"
                className="ml-1 p-1 hover:text-white text-white/70 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Architecture Guide Button */}
            <button
              id="btn-open-guide"
              onClick={onOpenBackendGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Backend Guide</span>
            </button>

            {/* Venue Umpire Deck / Scorekeeper Button */}
            <button
              id="btn-open-venue-deck"
              onClick={onOpenVenueDeck}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm ${
                venueModeActive
                  ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Venue Scorekeeper</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
