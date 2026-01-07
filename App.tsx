
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { VideoGallery } from './components/VideoGallery';
import { Message, Role, ChatSession, UserStats } from './types';
import { chatStream, generateImage, generateVideo, analyzeImage } from './services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window { aistudio?: AIStudio; }
}

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [usePro, setUsePro] = useState(false);
  const [lastMedia, setLastMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ videoTrialCount: 0, isSubscribed: false });
  const [view, setView] = useState<'chat' | 'gallery'>('chat');

  useEffect(() => {
    const savedSessions = localStorage.getItem('indian_ai_sessions_v7');
    const savedStats = localStorage.getItem('indian_ai_stats_v7');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed.map((s: any) => ({ ...s, updatedAt: new Date(s.updatedAt) })));
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    } else { createNewChat(); }
    if (savedStats) setUserStats(JSON.parse(savedStats));
  }, []);

  useEffect(() => localStorage.setItem('indian_ai_sessions_v7', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('indian_ai_stats_v7', JSON.stringify(userStats)), [userStats]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!activeSessionId) return;
    const trimmedText = text.trim();
    if (!trimmedText && !imageFile) return;

    setIsLoading(true);
    let userImageUrl: string | undefined;
    if (imageFile) {
      userImageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: Role.USER, content: text, timestamp: new Date(), imageUrl: userImageUrl };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? text.substring(0, 30) : s.title, updatedAt: new Date() } : s));

    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = { id: aiMsgId, role: Role.AI, content: 'Indian AI is thinking...', timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));

    const lowerText = trimmedText.toLowerCase();
    const videoKeys = ['video', 'animation', 'movie', 'chalchitra', 'film', 'clip'];
    const imageKeys = ['image', 'photo', 'picture', 'tasveer', 'chitra', 'drawing', 'portrait'];
    const triggerKeys = ['make', 'create', 'banao', 'dikhao', 'generate', 'show', 'draw'];

    const isVideo = videoKeys.some(k => lowerText.includes(k)) || lowerText.startsWith('/video');
    const isImage = imageKeys.some(k => lowerText.includes(k)) || lowerText.startsWith('/image');
    const hasTrigger = triggerKeys.some(k => lowerText.includes(k));
    
    const isMediaRequest = isVideo || isImage || (hasTrigger && (lowerText.includes('video') || lowerText.includes('photo')));

    try {
      if (isMediaRequest) {
        let plan = "";
        await chatStream(trimmedText, activeSession?.messages || [], (chunk) => {
          plan += chunk;
          updateAiMessage(aiMsgId, plan);
        }, { isMediaPlanning: true });

        let prompt = trimmedText.replace(/^\/(image|video)\s*/i, '')
          .replace(/(generate|create|make|banao|show|dikhao|video|image|photo|picture|tasveer|chitra|chalchitra)\s+(a|an)?\s+(video|image|photo|picture)?\s+(of|about)?\s+/gi, '')
          .trim() || "A beautiful scenic view of Bharat";

        if (isImage) {
          const res = await generateImage(prompt, lowerText.includes('fix') && lastMedia?.type === 'image' ? lastMedia.url : undefined);
          if (res) { setLastMedia({ url: res, type: 'image' }); updateAiMessage(aiMsgId, plan + "\n\nPhoto complete!", res); }
        }
        if (isVideo) {
          if (!userStats.isSubscribed && userStats.videoTrialCount >= 3) {
            updateAiMessage(aiMsgId, plan + "\n\nTrial Expired. Upgrade to Bharat Premium for unlimited 15s 3D videos.");
            return;
          }
          if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) await window.aistudio.openSelectKey();
          const res = await generateVideo(prompt, (msg) => updateAiMessage(aiMsgId, plan + "\n\n" + msg));
          if (res) {
            setLastMedia({ url: res, type: 'video' });
            if (!userStats.isSubscribed) setUserStats(p => ({ ...p, videoTrialCount: p.videoTrialCount + 1 }));
            updateAiMessage(aiMsgId, plan + "\n\nYour 15s 3D cinematic clip is ready!", undefined, undefined, true, res);
          }
        }
      } else if (imageFile) {
        const res = await analyzeImage(userImageUrl!.split(',')[1], imageFile.type, text || "What is in this image?");
        updateAiMessage(aiMsgId, res || "Analysis failed.");
      } else {
        let full = "";
        const res = await chatStream(text, activeSession?.messages || [], (chunk) => { full += chunk; updateAiMessage(aiMsgId, full); }, { useSearch, usePro });
        updateAiMessage(aiMsgId, res.fullText, undefined, res.sources);
      }
    } catch (e: any) {
      if (e.message === "KEY_RESET") {
        updateAiMessage(aiMsgId, "Paid API Key required for 3D video. Please select your key.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else { updateAiMessage(aiMsgId, "Dukh hai, kuch technical problem aayi."); }
    } finally { setIsLoading(false); }
  };

  const handleEditVideo = async (originalMessage: Message, editPrompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
    setView('chat');
    setIsLoading(true);
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = { id: aiMsgId, role: Role.AI, content: 'Starting Bharat Studio rendering...', timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));

    try {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) await window.aistudio.openSelectKey();
      const res = await generateVideo(editPrompt, (msg) => updateAiMessage(aiMsgId, msg), originalMessage.videoUrl, aspectRatio);
      if (res) {
        updateAiMessage(aiMsgId, "Edit complete! Your vision has been updated.", undefined, undefined, true, res);
      }
    } catch (e: any) {
      if (e.message === "KEY_RESET") {
        updateAiMessage(aiMsgId, "Paid API Key required for editing. Please select your key.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        updateAiMessage(aiMsgId, "Maafi chahte hain, editing failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateAiMessage = (id: string, content: string, imageUrl?: string, sources?: any[], isVideo = false, videoUrl?: string) => {
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === id ? { ...m, content, imageUrl: imageUrl || m.imageUrl, videoUrl: videoUrl || m.videoUrl, sources: sources || m.sources } : m) } : s));
  };

  const createNewChat = () => {
    const s: ChatSession = { id: crypto.randomUUID(), title: 'New Bharat Chat', messages: [], updatedAt: new Date() };
    setSessions(p => [s, ...p]); setActiveSessionId(s.id);
    setView('chat');
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      {/* Centered Top Flag Emblem */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] pointer-events-none hidden md:block">
        <div className="mt-2 flex flex-col items-center float-animation">
          <div className="w-14 h-14 bg-white rounded-full shadow-2xl border-4 border-orange-500/30 flex items-center justify-center text-4xl flag-pulse overflow-hidden bg-gradient-to-b from-orange-400 via-white to-green-500">
            <span className="drop-shadow-md">🇮🇳</span>
          </div>
          <div className="text-[9px] font-black text-slate-800 uppercase tracking-[0.3em] mt-2 bg-white/90 px-3 py-1 rounded-full backdrop-blur-md shadow-sm border border-orange-100">
            Bharat AI
          </div>
        </div>
      </div>

      <Sidebar 
        sessions={sessions} 
        activeId={activeSessionId} 
        onSelect={(id) => { setActiveSessionId(id); setView('chat'); }} 
        onNew={createNewChat} 
        onDelete={(id) => setSessions(p => p.filter(x => x.id !== id))} 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        view={view}
        setView={setView}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-[#fffaf5] relative">
        {view === 'chat' ? (
          <ChatWindow 
            messages={activeSession?.messages || []} 
            onSend={handleSendMessage} 
            isLoading={isLoading} 
            useSearch={useSearch} 
            setUseSearch={setUseSearch} 
            usePro={usePro} 
            setUsePro={setUsePro} 
            userStats={userStats} 
            onSubscribe={() => { if (window.confirm("Upgrade to Premium for $100/day?")) setUserStats(p => ({ ...p, isSubscribed: true })); }} 
          />
        ) : (
          <VideoGallery sessions={sessions} onEdit={handleEditVideo} />
        )}
      </main>
    </div>
  );
};

export default App;
