import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export const AnnadharaAIWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-annadhara-ai', handleOpen);
    return () => window.removeEventListener('open-annadhara-ai', handleOpen);
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-[#2E7D5B] text-white font-bold text-xs shadow-2xl hover:bg-[#205B43] hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white ring-4 ring-[#2E7D5B]/20 group cursor-pointer"
        aria-label="Toggle Annadhara AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-white animate-ping" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <span className="tracking-wide font-extrabold text-[13px]">Annadhara AI</span>
      </button>

      {/* Chat Window Panel */}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </>
  );
};
