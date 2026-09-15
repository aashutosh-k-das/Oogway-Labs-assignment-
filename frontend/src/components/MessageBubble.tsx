/* Executive Message Bubble */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ExternalLink, 
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  User, 
  Clock, 
  BookOpen, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronUp,
  Code2
} from 'lucide-react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onViewArtifact?: (message: Message) => void;
}

export function MessageBubble({ message, onViewArtifact }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.created_at || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-3.5 w-full animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#090d16]"></span>
        </div>
      )}

      {/* Message Body Container */}
      <div className={`flex flex-col min-w-0 ${isUser ? 'items-end max-w-[85%] md:max-w-[75%]' : 'items-start flex-1 max-w-full'}`}>
        {/* Meta Header */}
        <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] text-slate-400 font-medium">
          <span className={isUser ? 'text-indigo-300 font-semibold' : 'text-slate-300 font-semibold'}>
            {isUser ? 'You' : 'Lenny Growth AI'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock size={10} />
            {formattedTime}
          </span>
        </div>

        {/* Content Box */}
        <div
          className={`w-full text-sm rounded-2xl p-4 transition-all ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/15 rounded-tr-sm border border-indigo-400/20'
              : 'bg-slate-900/90 text-slate-100 border border-slate-800/90 shadow-lg shadow-black/20 rounded-tl-sm backdrop-blur-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed text-indigo-50 font-normal">
              {message.content}
            </p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Artifact Callout Card (When an artifact is attached) */}
        {!isUser && message.artifact && (
          <div className="mt-3 w-full">
            <div 
              onClick={() => onViewArtifact?.(message)}
              className="group relative flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 shadow-md shadow-indigo-950/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all flex-shrink-0">
                  {message.artifact.type === 'html' ? <Code2 size={18} /> : <FileText size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight truncate group-hover:text-indigo-200 transition-colors">
                      {message.artifact.title || 'Generated Strategy Document'}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {message.artifact.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Ready for inspection, export, or presentation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pl-3 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors flex-shrink-0">
                <span>Open Studio</span>
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        )}

        {/* Sources / Citations Drawer */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 w-full">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <BookOpen size={12} className="text-cyan-400" />
                <span>Grounded Sources ({message.sources.length})</span>
              </div>
              {message.sources.length > 2 && (
                <button
                  onClick={() => setShowAllSources(!showAllSources)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <span>{showAllSources ? 'Show less' : `Show all +${message.sources.length - 2}`}</span>
                  {showAllSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(showAllSources ? message.sources : message.sources.slice(0, 2)).map((source, idx) => (
                <a
                  key={`${source.id || idx}-${idx}`}
                  href={source.post_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {source.guest ? `🎙️ ${source.guest}` : `📄 ${source.title}`}
                    </span>
                    <ExternalLink size={11} className="text-slate-500 group-hover:text-indigo-400 flex-shrink-0 mt-0.5" />
                  </div>
                  {source.chunk_content && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      "{source.chunk_content.trim()}"
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span className="truncate max-w-[150px]">{source.title}</span>
                    {source.start_time && (
                      <span className="font-mono text-cyan-400">{source.start_time}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Message Actions (Copy & Quick Feedback) */}
        <div className="flex items-center gap-2 mt-2 px-1 text-slate-400">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer"
            title="Copy message to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-300">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
