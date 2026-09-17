import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Download,
  Github,
  Check,
  Radio,
  Save,
  Trash2,
  ExternalLink,
  Code2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { CategoryDef, MatchScoreEntry, TournamentScoresFile } from '../types';
import {
  formatScoresFile,
  loadGitHubSettings,
  saveGitHubSettings,
  commitScoresToGitHub,
  GitHubSettings,
} from '../utils/scoreSync';
import { determineMatchWinner } from '../utils/tournamentEngine';

interface VenueScorekeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDef[];
  currentScores: Record<string, MatchScoreEntry>;
  selectedMatchId?: string;
  onUpdateScore: (matchId: string, scoreEntry: MatchScoreEntry | null) => void;
  onRefreshLive: () => void;
}

export const VenueScorekeeperModal: React.FC<VenueScorekeeperModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentScores,
  selectedMatchId,
  onUpdateScore,
  onRefreshLive,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'github' | 'json'>('editor');
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [activeMatchId, setActiveMatchId] = useState<string>(selectedMatchId || '');

  // Active match edit states
  const [set1A, setSet1A] = useState<string>('');
  const [set1B, setSet1B] = useState<string>('');
  const [set2A, setSet2A] = useState<string>('');
  const [set2B, setSet2B] = useState<string>('');
  const [set3A, setSet3A] = useState<string>('');
  const [set3B, setSet3B] = useState<string>('');
  const [manualWinner, setManualWinner] = useState<'A' | 'B' | ''>('');
  const [isWalkover, setIsWalkover] = useState<boolean>(false);

  // GitHub Settings
  const [ghSettings, setGhSettings] = useState<GitHubSettings>(loadGitHubSettings);
  const [ghStatus, setGhStatus] = useState<{ loading: boolean; message: string; isError?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync selected match when prop changes or category changes
  useEffect(() => {
    if (selectedMatchId) {
      setActiveMatchId(selectedMatchId);
      // find category for this match
      for (const cat of categories) {
        const hasMatch =
          cat.rounds.some((r) => r.matches.some((m) => m.id === selectedMatchId)) ||
          cat.groups?.some((g) => g.matches.some((m) => m.id === selectedMatchId));
        if (hasMatch) {
          setSelectedCatId(cat.id);
          break;
        }
      }
    }
  }, [selectedMatchId, categories]);

  // Load existing match score when activeMatchId changes
  useEffect(() => {
    if (!activeMatchId) return;
    const existing = currentScores[activeMatchId];
    if (existing) {
      const sets = existing.sets || [];
      setSet1A(sets[0]?.[0]?.toString() ?? '');
      setSet1B(sets[0]?.[1]?.toString() ?? '');
      setSet2A(sets[1]?.[0]?.toString() ?? '');
      setSet2B(sets[1]?.[1]?.toString() ?? '');
      setSet3A(sets[2]?.[0]?.toString() ?? '');
      setSet3B(sets[2]?.[1]?.toString() ?? '');
      setManualWinner(existing.winner ? (existing.winner as 'A' | 'B') : '');
      setIsWalkover(existing.status === 'walkover');
    } else {
      setSet1A('');
      setSet1B('');
      setSet2A('');
      setSet2B('');
      setSet3A('');
      setSet3B('');
      setManualWinner('');
      setIsWalkover(false);
    }
  }, [activeMatchId, currentScores]);

  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  // List all matches for the current category
  const allMatchesInCat: { id: string; label: string }[] = [];
  if (currentCategory.groups) {
    currentCategory.groups.forEach((g) => {
      g.matches.forEach((m) => {
        allMatchesInCat.push({ id: m.id, label: `[${g.name}] ${m.id} : ${m.a} vs ${m.b}` });
      });
    });
  }
  currentCategory.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      const sideAStr = typeof m.a === 'string' ? m.a : 'p' in m.a ? m.a.p : 'ref' in m.a ? m.a.ref : 'TBD';
      const sideBStr = typeof m.b === 'string' ? m.b : 'p' in m.b ? m.b.p : 'ref' in m.b ? m.b.ref : 'TBD';
      allMatchesInCat.push({ id: m.id, label: `[${r.name}] ${m.id} : ${sideAStr} vs ${sideBStr}` });
    });
  });

  // Calculate simulated winner
  const setsData: [number, number][] = [];
  if (set1A !== '' && set1B !== '') setsData.push([parseInt(set1A, 10) || 0, parseInt(set1B, 10) || 0]);
  if (set2A !== '' && set2B !== '') setsData.push([parseInt(set2A, 10) || 0, parseInt(set2B, 10) || 0]);
  if (set3A !== '' && set3B !== '') setsData.push([parseInt(set3A, 10) || 0, parseInt(set3B, 10) || 0]);

  const simulatedEntry: MatchScoreEntry = {
    sets: setsData,
    winner: manualWinner ? manualWinner : undefined,
    status: isWalkover ? 'walkover' : setsData.length > 0 ? 'completed' : 'pending',
  };

  const evalResult = determineMatchWinner(
    simulatedEntry,
    currentCategory.targetScore,
    currentCategory.capScore,
    currentCategory.bestOf
  );

  const handleSaveMatchScore = () => {
    if (!activeMatchId) return;
    if (setsData.length === 0 && !manualWinner) {
      // Clear score
      onUpdateScore(activeMatchId, null);
    } else {
      onUpdateScore(activeMatchId, {
        sets: setsData,
        winner: manualWinner || evalResult.winner || undefined,
        status: isWalkover ? 'walkover' : 'completed',
      });
    }
  };

  const handleClearScore = () => {
    if (!activeMatchId) return;
    setSet1A('');
    setSet1B('');
    setSet2A('');
    setSet2B('');
    setSet3A('');
    setSet3B('');
    setManualWinner('');
    setIsWalkover(false);
    onUpdateScore(activeMatchId, null);
  };

  const scoresJsonFile = formatScoresFile(currentScores);
  const jsonContent = JSON.stringify(scoresJsonFile, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scores.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGitHubCommit = async () => {
    setGhStatus({ loading: true, message: 'Committing to GitHub repository...' });
    try {
      saveGitHubSettings(ghSettings);
      const res = await commitScoresToGitHub(
        ghSettings,
        scoresJsonFile,
        `Update badminton match scores [Match: ${activeMatchId || 'Batch'}]`
      );
      setGhStatus({ loading: false, message: res.message, isError: false });
      setTimeout(() => onRefreshLive(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGhStatus({ loading: false, message: msg, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0e120e] border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#141914] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/20 text-amber-300">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-heading text-white tracking-wide">
                Venue Scorekeeper &amp; File Backend Deck
              </h3>
              <p className="text-xs text-[#9ba498]">
                Court Score Entry · Auto-Compute Winners · Commit to GitHub Pages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center border-b border-white/10 bg-[#090c09] px-5">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Match Score Editor
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'github'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub 1-Click Commit</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'json'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>scores.json Preview</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'editor' && (
            <div className="space-y-5">
              {/* Category & Match Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                    1. Select Tournament Category
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => {
                      setSelectedCatId(e.target.value);
                      setActiveMatchId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.chip})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                    2. Select Match
                  </label>
                  <select
                    value={activeMatchId}
                    onChange={(e) => setActiveMatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Choose a Match to Score --</option>
                    {allMatchesInCat.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeMatchId ? (
                <div className="p-4 sm:p-5 rounded-xl bg-black/50 border border-white/10 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <span className="text-base font-bold font-heading text-white">
                      Scoring Match: <span className="text-amber-400">{activeMatchId}</span>
                    </span>
                    <span className="text-xs text-white/50">
                      Rule: Target {currentCategory.targetScore} pts (Cap {currentCategory.capScore}), Best of{' '}
                      {currentCategory.bestOf}
                    </span>
                  </div>

                  {/* Sets Score Input Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Set 1 */}
                    <div className="p-3 rounded-lg bg-[#141914] border border-white/10">
                      <div className="text-xs font-semibold text-[#9ba498] uppercase mb-2">
                        Set 1 Points
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={currentCategory.capScore}
                          placeholder="Side A"
                          value={set1A}
                          onChange={(e) => setSet1A(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-center font-mono-code text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-white/40 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          max={currentCategory.capScore}
                          placeholder="Side B"
                          value={set1B}
                          onChange={(e) => setSet1B(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-center font-mono-code text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Set 2 */}
                    <div className="p-3 rounded-lg bg-[#141914] border border-white/10">
                      <div className="text-xs font-semibold text-[#9ba498] uppercase mb-2">
                        Set 2 (Optional)
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={currentCategory.capScore}
                          placeholder="Side A"
                          value={set2A}
                          onChange={(e) => setSet2A(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-center font-mono-code text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-white/40 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          max={currentCategory.capScore}
                          placeholder="Side B"
                          value={set2B}
                          onChange={(e) => setSet2B(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-center font-mono-code text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Set 3 */}
                    <div className="p-3 rounded-lg bg-[#141914] border border-white/10">
                      <div className="text-xs font-semibold text-[#9ba498] uppercase mb-2">
                        Set 3 Decider (Optional)
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={currentCategory.capScore}
                          placeholder="Side A"
                          value={set3A}
                          onChange={(e) => setSet3A(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-center font-mono-code text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-white/40 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          max={currentCategory.capScore}
                          placeholder="Side B"
                          value={set3B}
                          onChange={(e) => setSet3B(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-center font-mono-code text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual Winner / Walkover override */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs font-semibold text-[#9ba498]">Override Winner / W.O:</span>
                    <button
                      type="button"
                      onClick={() => setManualWinner(manualWinner === 'A' ? '' : 'A')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        manualWinner === 'A'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      Side A Wins
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualWinner(manualWinner === 'B' ? '' : 'B')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        manualWinner === 'B'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      Side B Wins
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWalkover(!isWalkover)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isWalkover
                          ? 'bg-rose-600 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {isWalkover ? 'Walkover (W/O) Active' : 'Mark as Walkover (W/O)'}
                    </button>
                  </div>

                  {/* Auto-Compute Indicator */}
                  <div className="p-3 rounded-lg bg-[#121612] border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#9ba498]">Computed Winner: </span>
                      <span className="font-bold text-emerald-400 ml-1">
                        {manualWinner
                          ? `Manual Override (${manualWinner})`
                          : evalResult.winner
                          ? `Side ${evalResult.winner} (Auto-computed from points)`
                          : 'Unfinished / Tied'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9ba498]">Status: </span>
                      <span className="font-semibold text-white ml-1">
                        {isWalkover
                          ? 'Walkover'
                          : evalResult.isComplete
                          ? 'Completed'
                          : 'In Progress'}
                      </span>
                    </div>
                  </div>

                  {/* Save & Clear Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClearScore}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset / Clear Match</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveMatchScore}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Update Live Bracket</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-black/40 border border-dashed border-white/15 text-center text-[#9ba498] text-sm">
                  Please pick a match above to record scores or award a winner.
                </div>
              )}
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm leading-relaxed">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <Github className="w-4 h-4" />
                  <span>Direct GitHub Commit from Venue (Zero Terminal Needed)</span>
                </div>
                You can commit updated scores directly to your GitHub repository using a GitHub
                Personal Access Token (PAT). Once committed, GitHub Pages will automatically deploy
                and all spectators will see the live score within 30-60 seconds!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    GitHub Username or Org (e.g. kalpathysports)
                  </label>
                  <input
                    type="text"
                    placeholder="Owner"
                    value={ghSettings.owner}
                    onChange={(e) => setGhSettings({ ...ghSettings, owner: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Repository Name (e.g. ksf2026-badminton)
                  </label>
                  <input
                    type="text"
                    placeholder="Repo"
                    value={ghSettings.repo}
                    onChange={(e) => setGhSettings({ ...ghSettings, repo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Branch (default: main or gh-pages)
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={ghSettings.branch}
                    onChange={(e) => setGhSettings({ ...ghSettings, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    File Path in Repo
                  </label>
                  <input
                    type="text"
                    placeholder="public/data/scores.json"
                    value={ghSettings.filePath}
                    onChange={(e) => setGhSettings({ ...ghSettings, filePath: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    GitHub Personal Access Token (PAT) with repo/contents write access
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                    value={ghSettings.token}
                    onChange={(e) => setGhSettings({ ...ghSettings, token: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white font-mono-code focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-[#9ba498] mt-1">
                    Stored securely only in your browser local storage. Never transmitted to any
                    third-party server.
                  </p>
                </div>
              </div>

              {ghStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                    ghStatus.isError
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {ghStatus.message}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    saveGitHubSettings(ghSettings);
                    alert('GitHub settings saved locally!');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  Save Settings Only
                </button>

                <button
                  type="button"
                  onClick={handleGitHubCommit}
                  disabled={ghStatus?.loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  <Github className="w-4 h-4" />
                  <span>{ghStatus?.loading ? 'Committing...' : 'Push Live Commit to GitHub'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9ba498]">
                  This is the exact JSON that serves as your file-based backend for GitHub Pages.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-medium border border-amber-400/30 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download scores.json</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-emerald-300 font-mono-code text-xs max-h-96 overflow-auto">
                {jsonContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#141914] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#9ba498]">
            Active Matches Scored: <b className="text-white">{Object.keys(currentScores).length}</b>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Quick Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
