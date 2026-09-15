/* Executive Message Composer */

import { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Loader2, 
  Sparkles, 
  Command, 
  FileCode, 
  Zap, 
  TrendingUp, 
  Feather 
} from 'lucide-react';

interface MessageComposerProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { icon: <TrendingUp size={12} className="text-emerald-400" />, label: 'Retention Loops', prompt: 'Explain how the best consumer apps build enduring retention loops based on Lenny\'s interviews.' },
  { icon: <FileCode size={12} className="text-indigo-400" />, label: '1-Page PRD', prompt: 'Create a 1-page product requirements document (PRD) template used by top Silicon Valley product teams.' },
  { icon: <Feather size={12} className="text-cyan-400" />, label: 'Ship 30 Essay', prompt: 'Write a high-converting Ship 30 for 30 style essay on how AI is changing product management in 2026.' },
  { icon: <Zap size={12} className="text-amber-400" />, label: 'PLG Funnel', prompt: 'Break down the step-by-step Product-Led Growth (PLG) activation strategy recommended by Lenny\'s guests.' },
];

export function MessageComposer({ onSend, isLoading, disabled }: MessageComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleApplyQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      {/* Quick Prompt Pills */}
      {!input && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 pr-1 flex-shrink-0">
            <Sparkles size={11} className="text-indigo-400" />
            <span>Templates:</span>
          </span>
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyQuickPrompt(item.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-medium flex-shrink-0 cursor-pointer shadow-sm"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Floating Input Dock */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 shadow-2xl shadow-black/40 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask strategic product questions, request PRD templates, or draft Ship30 essays..."
          rows={1}
          disabled={isLoading || disabled}
          className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500 resize-none max-h-[220px] leading-relaxed pr-12"
          aria-label="Message prompt"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 font-mono text-[10px]">Return</kbd>
              <span>to send</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 font-mono text-[10px]">Shift + Return</kbd>
              <span>new line</span>
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || disabled}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              input.trim() && !isLoading && !disabled
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-100'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            aria-label="Send prompt"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-indigo-300" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
