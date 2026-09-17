import React from 'react';
import { X, CheckCircle, FileText, Zap, Shield, Globe, Terminal, RefreshCw, Smartphone } from 'lucide-react';

interface BackendGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0e120e] border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141914] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-heading text-white tracking-wide">
                Best File Format &amp; GitHub Pages Architecture Guide
              </h3>
              <p className="text-xs text-[#9ba498]">
                Best practices for file-based tournament backends &amp; live venue commits
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm leading-relaxed text-white/90">
          {/* Section 1: Best Format */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <h4 className="text-base font-bold font-heading text-amber-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>1. Which File Format is Best?</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#9ba498]">
              For a static site hosted on <b>GitHub Pages</b>, the absolute best format is a <b>clean, separated JSON file</b> (<code className="text-amber-300 font-mono-code">scores.json</code>) decoupled from your static bracket structure (<code className="text-amber-300 font-mono-code">fixtures.json</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                <span className="font-bold text-emerald-400 block mb-1">
                  ⭐ JSON (<code className="font-mono-code">scores.json</code>) — Recommended
                </span>
                <ul className="space-y-1 list-disc list-inside text-white/80">
                  <li>Native browser parsing via <code className="font-mono-code">fetch()</code> in &lt;1ms.</li>
                  <li>No external parsers or bundling overhead.</li>
                  <li>Separates immutable draw rules from dynamic match results.</li>
                  <li>Human-readable key-value map by Match ID.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                <span className="font-bold text-white/70 block mb-1">
                  Why not CSV, YAML, or JS?
                </span>
                <ul className="space-y-1 list-disc list-inside text-white/60">
                  <li><b>CSV</b> cannot cleanly represent multi-set scores (e.g. 15-12, 14-16, 15-13) or hierarchical tournament trees.</li>
                  <li><b>YAML</b> requires an extra 40KB client-side parser library.</li>
                  <li><b>JS files</b> can create script-tag injection and caching complications.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: How Auto-Winner Computation Works */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <h4 className="text-base font-bold font-heading text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>2. Automated Winner &amp; Bracket Progression Engine</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#9ba498]">
              Instead of manually updating future bracket slots when someone wins, the backend file only stores raw match scores. The HTML frontend computes everything dynamically on the fly:
            </p>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono-code text-xs text-emerald-300 overflow-x-auto">
              <pre>{`// In scores.json:
{
  "scores": {
    "WS-R1-M1": { "sets": [[15, 8]] },
    "WS-R1-M2": { "sets": [[11, 15]] }
  }
}

// In the browser engine:
// 1. WS-R1-M1 winner -> "Aneesha V P" (15 > 8)
// 2. WS-R1-M2 winner -> "Gowri Subramanian" (15 > 11)
// 3. WS-QF1 matchup: { a: { ref: "WS-R1-M1" }, b: { ref: "WS-R1-M2" } }
// -> Automatically becomes: "Aneesha V P" vs "Gowri Subramanian"!`}</pre>
            </div>

            <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-white/80">
              <li><b>Round-Robin Standings:</b> Matches played (P), Wins (W), Losses (L), Points For (PF), Points Against (PA), and Point Differential (Diff) calculate automatically from set scores.</li>
              <li><b>Deuce &amp; Cap Handling:</b> The engine respects official badminton rules (e.g. at 14-14, play continues to a 2-point lead or up to 17 cap).</li>
              <li><b>Championship Podium:</b> Crowning Champion, Runner-up, and 3rd place automatically once the final matches conclude.</li>
            </ul>
          </div>

          {/* Section 3: Live Venue Usage & GitHub Pages Cache Busting */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <h4 className="text-base font-bold font-heading text-amber-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>3. GitHub Pages Caching &amp; Fast Live Venue Updates</span>
            </h4>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <b>Critical GitHub Pages Notice:</b> GitHub Pages uses an aggressive CDN edge cache (<code className="font-mono-code">Cache-Control: max-age=600</code>, 10 minutes). If you just fetch <code className="font-mono-code">fetch('scores.json')</code>, spectators will see outdated scores for up to 10 minutes!
            </div>

            <p className="text-xs sm:text-sm text-[#9ba498]">
              <b>The Solution implemented in this app:</b> URL Cache-Busting + Background Polling.
            </p>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono-code text-xs text-sky-300">
              {`// App automatically polls every 20 seconds using timestamp query param:
fetch('./data/scores.json?_t=' + Date.now(), { cache: 'no-store' });`}
            </div>

            <p className="text-xs sm:text-sm text-white/80">
              This guarantees that the instant GitHub completes the build (~30 seconds after git commit), every phone, screen, or spectator tab in the stadium updates automatically!
            </p>
          </div>

          {/* Section 4: 3 Simple Ways to Update Scores at the Venue */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <h4 className="text-base font-bold font-heading text-amber-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>4. Three Simple Approaches for Venue Scorekeepers</span>
            </h4>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                  A
                </span>
                <div>
                  <b className="text-white">Built-in Venue Scorekeeper (Easiest — 1 Tap from Court)</b>
                  <p className="text-[#9ba498] text-xs mt-0.5">
                    Click the <b>Venue Scorekeeper</b> button in the top bar. Enter scores, click "Push Live Commit to GitHub". Uses your GitHub token to commit via GitHub API directly from your phone — no coding, no git command line, no terminal!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                  B
                </span>
                <div>
                  <b className="text-white">GitHub Web Browser Editor (No Setup Needed)</b>
                  <p className="text-[#9ba498] text-xs mt-0.5">
                    Navigate to <code className="text-amber-300 font-mono-code">public/data/scores.json</code> on github.com on any laptop. Click the pencil edit icon, paste the updated score or use the "Copy scores.json" button from the app, then click "Commit changes".
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                  C
                </span>
                <div>
                  <b className="text-white">Local Git Terminal (For Tech Officials)</b>
                  <p className="text-[#9ba498] text-xs mt-0.5">
                    Download <code className="text-amber-300 font-mono-code">scores.json</code> and run:{' '}
                    <code className="text-emerald-400 font-mono-code">git commit -am "Update Court 1 scores" && git push</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141914] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs"
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
};
