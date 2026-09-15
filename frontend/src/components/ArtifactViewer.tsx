/* Artifact Studio — Executive Document Workspace */

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  X, 
  FileText, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  RotateCw, 
  Eye, 
  FileCode, 
  Sparkles, 
  Layers, 
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Artifact, Message } from '../types';

interface ArtifactViewerProps {
  messagesWithArtifacts: Message[];
  activeArtifact: Artifact | null;
  onSelectArtifact: (artifact: Artifact) => void;
  onClose: () => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function ArtifactViewer({
  messagesWithArtifacts,
  activeArtifact,
  onSelectArtifact,
  onClose,
  onRegenerate,
  isLoading,
}: ArtifactViewerProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    if (!activeArtifact?.content) return { words: 0, characters: 0, readTime: '1 min' };
    const text = activeArtifact.content.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
    return { words, characters, readTime };
  }, [activeArtifact]);

  const handleCopy = () => {
    if (!activeArtifact) return;
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeArtifact) return;
    const ext = activeArtifact.type === 'html' ? 'html' : 'md';
    const mimeType = activeArtifact.type === 'html' ? 'text/html' : 'text/markdown';
    const sanitizedTitle = (activeArtifact.title || 'strategy-doc')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `${sanitizedTitle || 'document'}.${ext}`;

    const blob = new Blob([activeArtifact.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-full w-full bg-[#0b0f19] border-l border-slate-800/80 overflow-hidden select-text ${
      isFullscreen ? 'fixed inset-0 z-50' : 'relative'
    }`}>
      {/* Left Artifact Rail (When multiple artifacts exist in the session) */}
      {messagesWithArtifacts.length > 1 && (
        <div className="w-52 border-r border-slate-800/60 bg-[#080c14] flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Layers size={14} className="text-indigo-400" />
              <span>Session Artifacts</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
              {messagesWithArtifacts.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {messagesWithArtifacts.map((msg, idx) => {
              const isSelected = activeArtifact === msg.artifact;
              return (
                <button
                  key={msg.id || idx}
                  onClick={() => msg.artifact && onSelectArtifact(msg.artifact)}
                  className={`w-full flex items-start gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/50 border border-indigo-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {msg.artifact?.type === 'html' ? <Code2 size={13} /> : <FileText size={13} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      {msg.artifact?.title || `Document ${idx + 1}`}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {msg.artifact?.type}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0c111d]">
        {/* Top Header & Toolbar */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3">
          {/* Document Title & Meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight truncate">
                  {activeArtifact?.title || 'Generated Artifact'}
                </h2>
                {activeArtifact && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                    {activeArtifact.type}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{stats.words} words</span>
                <span>•</span>
                <span>{stats.readTime}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={12} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode size={12} />
                <span className="hidden sm:inline">Source</span>
              </button>
            </div>

            {/* Regenerate Action */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Regenerate document"
              >
                <RotateCw size={14} />
              </button>
            )}

            {/* Copy Action */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Action */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
              title="Download file"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer hidden md:flex"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close Studio */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700/60 text-slate-400 transition-all cursor-pointer ml-1"
              title="Close Studio"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[#0c111d]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Synthesizing Document...</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Structuring insights, formatting framework tables, and polishing executive output.
              </p>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          )}

          {!activeArtifact ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3">
                <FileText size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No Document Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Select an artifact from the list or prompt Lenny to write a PRD or Ship30 essay.
              </p>
            </div>
          ) : activeTab === 'preview' ? (
            activeArtifact.type === 'html' ? (
              <HtmlRenderer content={activeArtifact.content} />
            ) : (
              <div className="max-w-3xl mx-auto markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeArtifact.content}
                </ReactMarkdown>
              </div>
            )
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-xl bg-[#090d16] border border-slate-800 p-4 font-mono text-xs text-indigo-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {activeArtifact.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HtmlRenderer({ content }: { content: string }) {
  let cleanContent = content;
  const match = content.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    cleanContent = match[1];
  } else {
    cleanContent = content.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '');
  }

  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 bg-white">
      <iframe
        srcDoc={cleanContent}
        sandbox=""
        title="Artifact HTML Canvas"
        className="w-full h-full min-h-[500px] border-none"
      />
    </div>
  );
}
