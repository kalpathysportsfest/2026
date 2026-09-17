import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, Award } from 'lucide-react';

interface RulesAccordionProps {
  id: string;
  formatBullets: string[];
  generalBullets: string[];
  chip: string;
}

export const RulesAccordion: React.FC<RulesAccordionProps> = ({
  id,
  formatBullets,
  generalBullets,
  chip,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-4 border border-white/10 rounded-xl bg-[#0f120f] overflow-hidden transition-all">
      <button
        id={`btn-rules-toggle-${id}`}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">✦</span>
          <span className="text-sm font-semibold text-white/90">Tournament Format &amp; Official Rules</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium">
            {chip}
          </span>
        </div>
        <div className="text-white/50 text-xs flex items-center gap-1">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-[#090b09] space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Format &amp; Scoring</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-[#9ba498] leading-relaxed">
              {formatBullets.map((rule, idx) => (
                <li key={idx} className="pl-1">
                  <span className="text-white/80">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>General Play Rules</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-[#9ba498] leading-relaxed">
              {generalBullets.map((rule, idx) => (
                <li key={idx} className="pl-1">
                  <span className="text-white/80">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
