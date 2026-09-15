/* Modern Executive Sidebar */

import { useState, useMemo } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Database, 
  Loader2, 
  Pencil, 
  Check, 
  X, 
  Search, 
  Sparkles, 
  Zap, 
  Layers,
  Flame,
  Radio
} from 'lucide-react';
import type { AppConfig, Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  config: AppConfig | null;
  onSelectSession: (id: string | null) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, title: string) => void;
  onIngest: () => void;
  isIngesting: boolean;
}

export function Sidebar({
  sessions,
  activeSessionId,
  config,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUpdateSession,
  onIngest,
  isIngesting,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Group sessions by date
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  const categorizedSessions = useMemo(() => {
    const today: Session[] = [];
    const yesterday: Session[] = [];
    const earlier: Session[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    filteredSessions.forEach(session => {
      const sessionTime = new Date(session.created_at).getTime();
      if (sessionTime >= todayStart) {
        today.push(session);
      } else if (sessionTime >= yesterdayStart) {
        yesterday.push(session);
      } else {
        earlier.push(session);
      }
    });

    return { today, yesterday, earlier };
  }, [filteredSessions]);

  const handleStartEdit = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editTitle.trim() && editTitle.trim() !== sessions.find(s => s.id === sessionId)?.title) {
      onUpdateSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  return (
    <aside className="flex flex-col h-full w-[280px] lg:w-[300px] flex-shrink-0 bg-[#0c111d] border-r border-slate-800/80 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div 
          onClick={() => onSelectSession(null)}
          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <Sparkles size={20} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0c111d] rounded-full animate-pulse"></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">Lenny Intelligence</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">RAG</span>
            </div>
            <p className="text-xs text-slate-400 truncate">Podcast & Newsletter Advisor</p>
          </div>
        </div>

        {/* New Chat Primary Action */}
        <button
          onClick={onNewChat}
          className="mt-3 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-md shadow-indigo-600/25 hover:shadow-indigo-500/40 transition-all cursor-pointer group"
          aria-label="New Chat"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
            </div>
            <span className="font-semibold text-sm">New Conversation</span>
          </div>
          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-indigo-200 font-mono">⌘K</span>
        </button>

        {/* Search / Filter Input */}
        {sessions.length > 3 && (
          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-2 text-slate-500">
              <MessageSquare size={18} />
            </div>
            <p className="text-xs font-medium text-slate-400">
              {searchQuery ? 'No matching chats found' : 'No conversations yet'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {searchQuery ? 'Try another keyword' : 'Start a chat to get strategic advice'}
            </p>
          </div>
        ) : (
          <>
            {/* Today */}
            {categorizedSessions.today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Flame size={12} className="text-amber-400" />
                  <span>Today</span>
                </div>
                <div className="space-y-0.5">
                  {categorizedSessions.today.map(session => renderSessionItem(session))}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {categorizedSessions.yesterday.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Layers size={12} className="text-cyan-400" />
                  <span>Yesterday</span>
                </div>
                <div className="space-y-0.5">
                  {categorizedSessions.yesterday.map(session => renderSessionItem(session))}
                </div>
              </div>
            )}

            {/* Earlier */}
            {categorizedSessions.earlier.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <MessageSquare size={12} className="text-slate-500" />
                  <span>Earlier</span>
                </div>
                <div className="space-y-0.5">
                  {categorizedSessions.earlier.map(session => renderSessionItem(session))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info & Ingestion Engine */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-col gap-2">
        {/* Ingest Action Button */}
        <button
          onClick={onIngest}
          disabled={isIngesting}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
          title="Sync vector embeddings with podcast and newsletter transcripts"
        >
          <div className="flex items-center gap-2">
            {isIngesting ? (
              <Loader2 size={14} className="animate-spin text-indigo-400" />
            ) : (
              <Database size={14} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            )}
            <span className="font-medium">{isIngesting ? 'Syncing Knowledge...' : 'Sync Transcripts'}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">RAG Index</span>
        </button>

        {/* Model Specs Card */}
        {config && (
          <div className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Radio size={12} className="text-emerald-400 animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engine</p>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {config.llm_model}
                </p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
              k={config.rag_top_k}
            </span>
          </div>
        )}
      </div>
    </aside>
  );

  function renderSessionItem(session: Session) {
    const isActive = session.id === activeSessionId;
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-indigo-950/70 to-slate-900/90 text-white border border-indigo-500/40 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
        }`}
      >
        <MessageSquare 
          size={15} 
          className={`flex-shrink-0 transition-colors ${
            isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
          }`} 
        />

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(session.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              className="flex-1 bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
            />
            <button
              onClick={() => handleSaveEdit(session.id)}
              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
              title="Save"
            >
              <Check size={13} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 rounded text-slate-400 hover:bg-slate-800"
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 truncate tracking-tight">
              {session.title || 'Untitled Chat'}
            </span>

            {/* Hover Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                onClick={(e) => handleStartEdit(session, e)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                title="Rename conversation"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete conversation"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
}
