/* Modern Chat Area & Launchpad */

import { useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Compass, 
  TrendingUp, 
  FileText, 
  Feather, 
  ArrowRight, 
  ShieldCheck, 
  Radio, 
  Lightbulb, 
  Target,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import type { Message } from '../types';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (content: string) => void;
  onViewArtifact: (message: Message) => void;
  hasSession: boolean;
  onNewChat?: () => void;
}

export function ChatArea({ 
  messages, 
  isLoading, 
  onSend, 
  onViewArtifact, 
  hasSession, 
  onNewChat 
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!hasSession) {
    return <WelcomeScreen onSend={onSend} onNewChat={onNewChat} />;
  }

  return (
    <div className="flex flex-col h-full min-w-0 min-h-0 bg-[#090d16]">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 min-w-0 min-h-0">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">How can I assist your product strategy today?</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ask deep questions across growth loops, hiring, retention, AI transformation, or request a complete PRD spec.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full text-left">
              {STARTER_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onSend(item.prompt)}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all text-xs cursor-pointer group shadow-sm"
                >
                  <span className="text-sm mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto pb-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onViewArtifact={onViewArtifact}
              />
            ))}

            {/* Pulsing Loading Wave */}
            {isLoading && (
              <div className="flex gap-3.5 items-start animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-2">
                  <span className="pulsing-dot" />
                  <span className="pulsing-dot" />
                  <span className="pulsing-dot" />
                  <span className="text-xs text-slate-400 ml-2 font-medium">Searching Lenny's Knowledge Base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Composer Dock */}
      <MessageComposer onSend={onSend} isLoading={isLoading} />
    </div>
  );
}

function WelcomeScreen({ 
  onSend, 
  onNewChat 
}: { 
  onSend: (content: string) => void;
  onNewChat?: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-[#090d16] via-[#0d1322] to-[#090d16] px-4 md:px-8 py-8 relative">
      {/* Background Glow Accents */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-48 right-12 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl w-full mx-auto my-auto flex flex-col items-center z-10 py-6">
        {/* Top Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles size={13} className="text-indigo-400 animate-pulse" />
          <span>Lenny's Knowledge Network & Executive Co-Pilot</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white text-center tracking-tight leading-[1.15] max-w-3xl">
          World-Class Product & Growth Intelligence
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm md:text-base text-slate-300 text-center max-w-2xl leading-relaxed">
          Grounded directly in transcripts and essays from the top 1% of product leaders, founders, and growth operators featured on <span className="text-indigo-300 font-semibold">Lenny's Podcast</span>.
        </p>

        {/* Feature Capability Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full mt-10">
          <PillarCard
            icon={<Target size={18} className="text-indigo-400" />}
            title="Product Strategy"
            description="PMF frameworks, pricing tiers, moat defensibility, and competitive moats."
            prompt="What are the most effective product-market fit benchmarks recommended by Lenny's guests?"
            onTrigger={onSend}
          />
          <PillarCard
            icon={<TrendingUp size={18} className="text-cyan-400" />}
            title="Growth Loops"
            description="Viral mechanics, retention engines, and onboarding activation tactics."
            prompt="How did Duolingo and Figma optimize their activation funnels and growth loops?"
            onTrigger={onSend}
          />
          <PillarCard
            icon={<FileText size={18} className="text-emerald-400" />}
            title="PRD Studio"
            description="Draft 1-page specs, technical requirements, and prioritization matrices."
            prompt="Write a complete 1-page PRD for an AI-powered onboarding assistant."
            onTrigger={onSend}
          />
          <PillarCard
            icon={<Feather size={18} className="text-amber-400" />}
            title="Ship 30 Essays"
            description="Convert frameworks into crisp, viral, atomic essays ready for publishing."
            prompt="Write a Ship 30 for 30 essay explaining the difference between good and great product leaders."
            onTrigger={onSend}
          />
        </div>

        {/* CTA Banner */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onNewChat}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Start a Strategy Session</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> 100% Grounded Citations</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Vector Similarity Search</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Live Artifact Canvas</span>
        </div>
      </div>
    </div>
  );
}

function PillarCard({ 
  icon, 
  title, 
  description, 
  prompt, 
  onTrigger 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  onTrigger: (prompt: string) => void;
}) {
  return (
    <div 
      onClick={() => onTrigger(prompt)}
      className="glass-card-interactive p-4 rounded-2xl flex flex-col justify-between cursor-pointer group"
    >
      <div>
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
        <span>Try this prompt</span>
        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

const STARTER_PROMPTS = [
  {
    icon: '🎯',
    title: 'Duolingo Growth Model',
    prompt: 'How did Duolingo reignite user growth using gamification and retention loops?',
  },
  {
    icon: '💡',
    title: 'Marc Andreessen on AI',
    prompt: 'What does Marc Andreessen think about AI architecture and software moats?',
  },
  {
    icon: '📊',
    title: 'Product Teams in 2026',
    prompt: 'How are modern product teams restructuring for AI-native workflows in 2026?',
  },
  {
    icon: '✍️',
    title: 'Draft Ship 30 Essay',
    prompt: 'Write an atomic Ship 30 style essay on finding product-market fit before scaling.',
  },
];
