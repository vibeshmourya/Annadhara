import React from 'react';
import { ExternalLink, ShieldCheck, Globe } from 'lucide-react';

/**
 * Renders verified clickable source citations for Annadhara AI responses
 */
export const CitationList = ({ citations = [] }) => {
  if (!Array.isArray(citations) || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-2.5 border-t border-[#E3EAE5]/80">
      <div className="flex items-center space-x-1.5 mb-2">
        <Globe className="w-3.5 h-3.5 text-[#2E7D5B]" />
        <span className="text-[11px] font-bold text-[#205B43] tracking-wide uppercase">
          Verified Sources ({citations.length})
        </span>
      </div>

      <div className="flex flex-col space-y-1.5">
        {citations.map((cite, index) => {
          const isOfficial = Boolean(cite.isOfficial);

          return (
            <a
              key={index}
              href={cite.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${
                isOfficial
                  ? 'bg-[#EAF4EE]/60 border-[#2E7D5B]/30 hover:bg-[#EAF4EE] hover:border-[#2E7D5B]'
                  : 'bg-white border-[#E3EAE5] hover:bg-stone-50 hover:border-[#2E7D5B]/30'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                {isOfficial ? (
                  <ShieldCheck className="w-4 h-4 text-[#2E7D5B] shrink-0" title="Official Regulatory Source" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#718078] shrink-0" />
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-[#26332D] truncate group-hover:text-[#2E7D5B] transition-colors leading-snug">
                    {cite.title || cite.domain}
                  </p>
                  <p className="text-[10px] text-[#718078] flex items-center space-x-1.5">
                    <span>{cite.domain || 'External Website'}</span>
                    {isOfficial && (
                      <span className="font-bold text-[#205B43] bg-[#EAF4EE] px-1.5 py-0.2 rounded-xs border border-[#2E7D5B]/20 text-[9px]">
                        Official Regulatory Portal
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <ExternalLink className="w-3.5 h-3.5 text-[#718078] group-hover:text-[#2E7D5B] shrink-0 transition-colors" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
