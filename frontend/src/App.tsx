/* Lenny Intelligence — Main App Controller */

import { useState, useCallback, useEffect } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  Menu, 
  Sparkles, 
  Plus, 
  FileText,
  Radio,
  Zap
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ArtifactViewer } from './components/ArtifactViewer';
import * as api from './api/client';
import type { Artifact, Message, Session, SessionDetail, AppConfig } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppContent() {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [showArtifact, setShowArtifact] = useState(() => {
    const saved = localStorage.getItem('lenny_showArtifact');
    return saved !== null ? saved === 'true' : false;
  });
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(() => {
    const saved = localStorage.getItem('lenny_showSidebar');
    return saved !== null ? saved === 'true' : true;
  });
  const [isIngesting, setIsIngesting] = useState(false);

  useEffect(() => {
    localStorage.setItem('lenny_showSidebar', showDesktopSidebar.toString());
  }, [showDesktopSidebar]);

  useEffect(() => {
    localStorage.setItem('lenny_showArtifact', showArtifact.toString());
  }, [showArtifact]);

  // Keyboard Shortcuts (⌘K / Ctrl+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createSessionMutation.mutate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: api.listSessions,
  });

  const { data: activeSession } = useQuery<SessionDetail>({
    queryKey: ['session', activeSessionId],
    queryFn: () => api.getSession(activeSessionId!),
    enabled: !!activeSessionId,
  });

  const { data: config } = useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: api.getConfig,
  });

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => api.createSession(title),
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setActiveSessionId(session.id);
      setShowMobileSidebar(false);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: api.deleteSession,
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.updateSession(id, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['session', activeSessionId] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      api.sendMessage(sessionId, content),
    onMutate: async ({ sessionId, content }) => {
      await qc.cancelQueries({ queryKey: ['session', sessionId] });
      const previous = qc.getQueryData<SessionDetail>(['session', sessionId]);
      if (previous) {
        const optimisticMsg: Message = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<SessionDetail>(['session', sessionId], {
          ...previous,
          messages: [...previous.messages, optimisticMsg],
        });
      }
      return { previous };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', activeSessionId] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(['session', variables.sessionId], context.previous);
      }
    },
  });

  // Auto-open artifact panel when an artifact arrives
  useEffect(() => {
    if (!activeSession?.messages) return;
    const msgs = activeSession.messages;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.artifact && lastMsg.role === 'assistant') {
      setActiveArtifact(lastMsg.artifact);
      setShowArtifact(true);
    }
  }, [activeSession?.messages]);

  // Reset artifacts when session changes
  useEffect(() => {
    setActiveArtifact(null);
    setShowArtifact(false);
  }, [activeSessionId]);

  const handleNewChat = useCallback(() => {
    createSessionMutation.mutate(undefined);
  }, [createSessionMutation]);

  const handleSend = useCallback(
    async (content: string) => {
      let targetId = activeSessionId;
      if (!targetId) {
        try {
          const newSession = await api.createSession();
          qc.invalidateQueries({ queryKey: ['sessions'] });
          setActiveSessionId(newSession.id);
          targetId = newSession.id;
        } catch (e) {
          console.error('Failed to create session on prompt send', e);
          return;
        }
      }
      sendMessageMutation.mutate({ sessionId: targetId, content });
    },
    [activeSessionId, sendMessageMutation, qc]
  );

  const handleViewArtifact = useCallback((message: Message) => {
    if (message.artifact) {
      setActiveArtifact(message.artifact);
      setShowArtifact(true);
    }
  }, []);

  const handleIngest = useCallback(async () => {
    setIsIngesting(true);
    try {
      await api.runIngestion();
      qc.invalidateQueries({ queryKey: ['config'] });
    } catch (e) {
      console.error('Ingestion error:', e);
    } finally {
      setIsIngesting(false);
    }
  }, [qc]);

  const sessionArtifacts = activeSession?.messages.filter((m) => m.artifact) || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-[#f8fafc]">
      {/* Mobile Drawer Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`${
          showMobileSidebar ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'
        } ${showDesktopSidebar ? 'md:flex' : 'md:hidden'} flex-shrink-0 transition-all duration-200`}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          config={config ?? null}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setShowMobileSidebar(false);
          }}
          onNewChat={handleNewChat}
          onDeleteSession={(id) => deleteSessionMutation.mutate(id)}
          onUpdateSession={(id, title) => updateSessionMutation.mutate({ id, title })}
          onIngest={handleIngest}
          isIngesting={isIngesting}
        />
      </div>

      {/* Main App Stage */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#090d16]">
        {/* Top Floating App Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white md:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
              className="hidden md:flex p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={showDesktopSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label="Toggle Sidebar"
            >
              {showDesktopSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>

            {/* Breadcrumb / Session Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-xs font-semibold text-slate-400">
                Lenny Assistant
              </span>
              <span className="hidden sm:inline text-slate-600">/</span>
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
                {activeSession?.title || 'Executive Advisory'}
              </h1>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Model Pill */}
            {config && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{config.llm_model}</span>
              </div>
            )}

            {/* Artifact Studio Trigger */}
            <button
              onClick={() => setShowArtifact(!showArtifact)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                showArtifact
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-400/30 shadow-indigo-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
              title={showArtifact ? 'Hide Artifact Studio' : 'Open Artifact Studio'}
            >
              {showArtifact ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              <span>Studio</span>
              {sessionArtifacts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono">
                  {sessionArtifacts.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Split Screen Workspace (Chat + Artifact Studio) */}
        <main className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Chat Stream Area */}
          <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${showArtifact ? 'hidden lg:flex' : 'flex'}`}>
            <ChatArea
              messages={activeSession?.messages ?? []}
              isLoading={sendMessageMutation.isPending}
              onSend={handleSend}
              onViewArtifact={handleViewArtifact}
              hasSession={!!activeSessionId}
              onNewChat={handleNewChat}
            />
          </div>

          {/* Artifact Studio Panel */}
          {showArtifact && (
            <div className="w-full lg:w-[48%] xl:w-[50%] min-w-0 min-h-0 flex-shrink-0 flex flex-col z-10 shadow-2xl">
              <ArtifactViewer
                messagesWithArtifacts={sessionArtifacts}
                activeArtifact={activeArtifact}
                onSelectArtifact={setActiveArtifact}
                onClose={() => setShowArtifact(false)}
                onRegenerate={() => {
                  if (activeSessionId) {
                    sendMessageMutation.mutate({
                      sessionId: activeSessionId,
                      content: 'Regenerate the strategy document with improved depth, clearer framework matrices, and actionable next steps.',
                    });
                  }
                }}
                isLoading={sendMessageMutation.isPending && showArtifact}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
