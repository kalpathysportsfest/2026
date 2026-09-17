import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CategoryDef, MatchScoreEntry, TournamentScoresFile } from './types';
import { FIXTURES_DATA, INITIAL_SCORES } from './data/tournamentData';
import { computeCategoryContext } from './utils/tournamentEngine';
import { fetchLiveScores } from './utils/scoreSync';
import { Header } from './components/Header';
import { KnockoutView } from './components/KnockoutView';
import { RoundRobinView } from './components/RoundRobinView';
import { VenueScorekeeperModal } from './components/VenueScorekeeperModal';
import { BackendGuideModal } from './components/BackendGuideModal';
import { Search, Radio, Trophy, Activity, Filter } from 'lucide-react';

const LOCAL_STORAGE_SCORES_KEY = 'ksf26_local_scores_draft';

export default function App() {
  const [categories] = useState<CategoryDef[]>(FIXTURES_DATA);
  const [activeCatId, setActiveCatId] = useState<string>('girls-singles');

  // Scores state
  const [scores, setScores] = useState<Record<string, MatchScoreEntry>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SCORES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load local scores draft', e);
    }
    return INITIAL_SCORES.scores;
  });

  // Sync state
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSource, setSyncSource] = useState<'live' | 'local' | 'error'>('local');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isVenueDeckOpen, setIsVenueDeckOpen] = useState<boolean>(false);
  const [isBackendGuideOpen, setIsBackendGuideOpen] = useState<boolean>(false);
  const [targetEditMatchId, setTargetEditMatchId] = useState<string | undefined>(undefined);
  const [isVenueModeActive, setIsVenueModeActive] = useState<boolean>(false);

  // Sync function to fetch live scores.json from server / GitHub Pages
  const handleSyncScores = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await fetchLiveScores('./data/scores.json');
      if (data && data.scores) {
        setScores(data.scores);
        setSyncSource('live');
        setLastSyncTime(new Date());
        localStorage.setItem(LOCAL_STORAGE_SCORES_KEY, JSON.stringify(data.scores));
      }
    } catch (err) {
      console.warn('Live fetch error (using local draft if available):', err);
      setSyncSource('local');
      setLastSyncTime(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial sync & periodic polling (every 25 seconds for live venue usage)
  useEffect(() => {
    handleSyncScores();
    const interval = setInterval(() => {
      handleSyncScores();
    }, 25000);
    return () => clearInterval(interval);
  }, [handleSyncScores]);

  // Update a single score from the Venue Deck
  const handleUpdateScore = (matchId: string, scoreEntry: MatchScoreEntry | null) => {
    setScores((prev) => {
      const next = { ...prev };
      if (!scoreEntry) {
        delete next[matchId];
      } else {
        next[matchId] = scoreEntry;
      }
      localStorage.setItem(LOCAL_STORAGE_SCORES_KEY, JSON.stringify(next));
      return next;
    });
    setSyncSource('local');
  };

  // Open editor for a specific match
  const handleEditMatch = (matchId: string) => {
    setTargetEditMatchId(matchId);
    setIsVenueDeckOpen(true);
  };

  // Selected category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCatId) || categories[0];
  }, [categories, activeCatId]);

  // Category computation context
  const activeContext = useMemo(() => {
    return computeCategoryContext(activeCategory, scores);
  }, [activeCategory, scores]);

  // Global tournament match statistics
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;

    categories.forEach((cat) => {
      if (cat.groups) {
        cat.groups.forEach((g) => {
          g.matches.forEach((m) => {
            total++;
            if (scores[m.id]?.status === 'completed' || scores[m.id]?.status === 'walkover' || (scores[m.id]?.sets?.length || 0) > 0) {
              completed++;
            }
          });
        });
      }
      cat.rounds.forEach((r) => {
        r.matches.forEach((m) => {
          total++;
          if (scores[m.id]?.status === 'completed' || scores[m.id]?.status === 'walkover' || (scores[m.id]?.sets?.length || 0) > 0) {
            completed++;
          }
        });
      });
    });

    return { total, completed, pending: total - completed };
  }, [categories, scores]);

  return (
    <div className="min-h-screen bg-[#050605] text-[#f6f3ea] flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Top Header */}
      <Header
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onRefresh={handleSyncScores}
        syncSource={syncSource}
        onOpenVenueDeck={() => {
          setTargetEditMatchId(undefined);
          setIsVenueDeckOpen(true);
        }}
        onOpenBackendGuide={() => setIsBackendGuideOpen(true)}
        venueModeActive={isVenueModeActive}
      />

      {/* Categories Navigation Bar */}
      <div className="border-b border-white/10 bg-[#080b08] sticky top-[73px] z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-2.5 overflow-x-auto no-scrollbar">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {categories.map((cat) => {
                const isActive = cat.id === activeCatId;
                return (
                  <button
                    key={cat.id}
                    id={`tab-${cat.id}`}
                    onClick={() => setActiveCatId(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#162058] text-white border border-indigo-400/40 shadow-sm shadow-indigo-900/30'
                        : 'bg-white/[0.03] text-[#9ba498] hover:text-white hover:bg-white/[0.08] border border-white/10'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Venue Mode Toggle button */}
            <div className="flex items-center gap-2 pl-4 border-l border-white/10 flex-shrink-0">
              <button
                onClick={() => setIsVenueModeActive(!isVenueModeActive)}
                title="Enable interactive click-to-edit on match cards"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isVenueModeActive
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-inner'
                    : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                }`}
              >
                <Radio className={`w-3 h-3 ${isVenueModeActive ? 'text-amber-400 animate-pulse' : ''}`} />
                <span>{isVenueModeActive ? 'Click-To-Score ON' : 'Interactive Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tournament Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tournament Overall Progress Bar */}
        <div className="p-3.5 rounded-xl bg-[#0a0d0a] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-white/80">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Tournament Progress:</span>
              <b className="text-white font-mono-code">
                {stats.completed} / {stats.total} Matches
              </b>
            </div>
            <div className="w-24 sm:w-40 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#9ba498]">
            <span>
              Remaining: <b className="text-white font-mono-code">{stats.pending}</b>
            </span>
            <span className="hidden sm:inline-block">·</span>
            <span className="hidden sm:inline-block text-emerald-400">
              File Backend: <code className="text-white/80 font-mono-code">scores.json</code>
            </span>
          </div>
        </div>

        {/* View Component: Knockout or Round Robin */}
        {activeCategory.type === 'knockout' ? (
          <KnockoutView
            category={activeCategory}
            context={activeContext}
            isVenueMode={isVenueModeActive}
            onEditMatch={handleEditMatch}
          />
        ) : (
          <RoundRobinView
            category={activeCategory}
            context={activeContext}
            isVenueMode={isVenueModeActive}
            onEditMatch={handleEditMatch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 bg-[#060806] text-center text-xs text-[#9ba498]">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>Kalpathy Sports Fest · 2026 Badminton Tournament Fixtures.</p>
          <p className="text-white/40">
            Powered by GitHub Pages File-Based Backend Architecture with Live Score Auto-Computation.
          </p>
        </div>
      </footer>

      {/* Venue Scorekeeper Modal / Deck */}
      <VenueScorekeeperModal
        isOpen={isVenueDeckOpen}
        onClose={() => setIsVenueDeckOpen(false)}
        categories={categories}
        currentScores={scores}
        selectedMatchId={targetEditMatchId}
        onUpdateScore={handleUpdateScore}
        onRefreshLive={handleSyncScores}
      />

      {/* Backend & GitHub Pages Architecture Guide Modal */}
      <BackendGuideModal
        isOpen={isBackendGuideOpen}
        onClose={() => setIsBackendGuideOpen(false)}
      />
    </div>
  );
}
