
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { VideoGallery } from './components/VideoGallery';
import { SubscriptionModal } from './components/SubscriptionModal';
import { Message, Role, ChatSession, UserStats } from './types';
import { chatStream, generateImage, generateVideo, analyzeImage, summarizeChat } from './services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface window { aistudio?: AIStudio; }
}

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [usePro, setUsePro] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ 
    videoTrialCount: 0, 
    dailyVideoCount: 0, 
    dailyImageCount: 0,
    lastVideoResetDate: new Date().toDateString(),
    isSubscribed: false 
  });
  const [view, setView] = useState<'chat' | 'gallery'>('chat');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Bharat Chat',
      messages: [],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setView('chat');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem('indian_ai_sessions_v7');
    const savedStats = localStorage.getItem('indian_ai_stats_v7');
    
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed.map((s: any) => ({ ...s, updatedAt: new Date(s.updatedAt) })));
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    } else { 
      createNewChat(); 
    }

    if (savedStats) {
      const stats = JSON.parse(savedStats);
      const today = new Date().toDateString();
      if (stats.lastVideoResetDate !== today) {
        const resetStats = { ...stats, dailyVideoCount: 0, dailyImageCount: 0, lastVideoResetDate: today };
        setUserStats(resetStats);
        localStorage.setItem('indian_ai_stats_v7', JSON.stringify(resetStats));
      } else {
        setUserStats(stats);
      }
    }
    
    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
  }, []);

  useEffect(() => localStorage.setItem('indian_ai_sessions_v7', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('indian_ai_stats_v7', JSON.stringify(userStats)), [userStats]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const updateAiMessage = (id: string, contentOrFn: string | ((prev: string) => string), mediaUrl?: string, type?: Message['type']) => {
    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      messages: s.messages.map(m => {
        if (m.id === id) {
          const currentContent = m.content === 'Indian AI is thinking...' ? '' : m.content;
          const newContent = typeof contentOrFn === 'function' ? contentOrFn(currentContent) : contentOrFn;
          return { 
            ...m, 
            content: newContent, 
            videoUrl: type === 'video-gen' ? mediaUrl : m.videoUrl,
            imageUrl: type === 'image-gen' ? mediaUrl : m.imageUrl,
            type: type || m.type
          };
        }
        return m;
      })
    } : s));
  };

  const handleSendMessage = async (text: string, file?: File, preferredRatio: string = "1:1") => {
    if (!activeSessionId) return;
    const trimmedText = text.trim();
    if (!trimmedText && !file) return;

    setIsLoading(true);
    let userImageUrl: string | undefined;
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    if (file) {
      const readerResult = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      userImageUrl = readerResult;
      const parts = readerResult.split(',');
      base64Data = parts[1];
      mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: Role.USER, content: text, timestamp: new Date(), imageUrl: userImageUrl };
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
      ...s, 
      messages: [...s.messages, userMsg], 
      title: s.messages.length === 0 ? (text.substring(0, 30) || 'Visual Query') : s.title, 
      updatedAt: new Date() 
    } : s));

    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = { id: aiMsgId, role: Role.AI, content: 'Indian AI is thinking...', timestamp: new Date() };
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
      ...s, 
      messages: [...s.messages, aiMsg] 
    } : s));

    await processAiTurn(text, aiMsgId, preferredRatio, userImageUrl, base64Data, mimeType);
  };

  const processAiTurn = async (text: string, aiMsgId: string, preferredRatio: string, userImageUrl?: string, base64Data?: string, mimeType?: string) => {
    try {
      const isMediaRequest = /video|image|photo|picture|render|make|create/i.test(text);
      
      if (isMediaRequest && text.toLowerCase().includes('video')) {
         // Quota check for videos
         if (!userStats.isSubscribed && (userStats.dailyVideoCount || 0) >= 3) {
            updateAiMessage(aiMsgId, "Jai Hind! You've used your 3 free daily video credits. Unlimited video pane ke liye upgrade plan ya subscription Lena hoga. Kal milte hain!");
            setIsLoading(false);
            return;
         }
         
         if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
           await window.aistudio.openSelectKey();
         }

         const videoUrl = await generateVideo(text, (msg) => updateAiMessage(aiMsgId, msg), undefined, preferredRatio as any);
         if (videoUrl) {
           setUserStats(prev => ({ 
             ...prev, 
             dailyVideoCount: (prev.dailyVideoCount || 0) + 1,
             videoTrialCount: prev.videoTrialCount + 1 
           }));
           updateAiMessage(aiMsgId, "Bharat Studio has rendered your 10s cinematic vision!", videoUrl, 'video-gen');
         } else {
           updateAiMessage(aiMsgId, "I encountered an error while rendering the video. Please try again.");
         }
      } else if (isMediaRequest && (text.toLowerCase().includes('image') || text.toLowerCase().includes('photo'))) {
         // Quota check for images
         if (!userStats.isSubscribed && (userStats.dailyImageCount || 0) >= 7) {
            updateAiMessage(aiMsgId, "Namaste! You've used your 7 free daily image creations. Unlimited image pane ke liye subscription Lena hoga. Kal naye credits milenge!");
            setIsLoading(false);
            return;
         }

         const imageUrl = await generateImage(text, preferredRatio, userImageUrl);
         if (imageUrl) {
           setUserStats(prev => ({ ...prev, dailyImageCount: (prev.dailyImageCount || 0) + 1 }));
           updateAiMessage(aiMsgId, `Here is the visual interpretation I created for you in ${preferredRatio} ratio.`, imageUrl, 'image-gen');
         } else {
           updateAiMessage(aiMsgId, "I couldn't generate the image right now. Let's try chatting instead.");
         }
      } else if (base64Data && mimeType) {
        const analysis = await analyzeImage(base64Data, mimeType, text || "Describe this image in detail.");
        updateAiMessage(aiMsgId, analysis || "I've analyzed the image.");
      } else {
        const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];
        const aiMsgIndex = currentMessages.findIndex(m => m.id === aiMsgId);
        const history = currentMessages.slice(0, aiMsgIndex).filter(m => m.content !== 'Indian AI is thinking...');
        
        const { fullText, sources } = await chatStream(text, history, (chunk) => {
          updateAiMessage(aiMsgId, prev => prev + chunk);
        }, { useSearch, usePro: usePro || userStats.isSubscribed });
        
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: fullText, sources } : m)
        } : s));
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      if (error.message === 'KEY_RESET' && window.aistudio) {
        await window.aistudio.openSelectKey();
        updateAiMessage(aiMsgId, "API Key was reset. Please try sending your request again.");
      } else {
        updateAiMessage(aiMsgId, "I'm sorry, I'm having trouble connecting to the brain of Indian AI. Please check your internet or try again in a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!activeSessionId || !activeSession) return;
    const msgIndex = activeSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    setIsLoading(true);
    const updatedUserMsg = { ...activeSession.messages[msgIndex], content: newText, timestamp: new Date() };
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = { id: aiMsgId, role: Role.AI, content: 'Indian AI is thinking...', timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      messages: [...s.messages.slice(0, msgIndex), updatedUserMsg, aiMsg],
      updatedAt: new Date()
    } : s));
    await processAiTurn(newText, aiMsgId, "1:1", updatedUserMsg.imageUrl);
  };

  const handleSummarize = async () => {
    if (!activeSession || activeSession.messages.length < 2) return;
    setIsLoading(true);
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = { id: aiMsgId, role: Role.AI, content: 'Bharat is summarizing this conversation for you...', timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
    try {
      const summary = await summarizeChat(activeSession.messages.filter(m => m.id !== aiMsgId && m.content !== 'Indian AI is thinking...'));
      updateAiMessage(aiMsgId, summary || "Sorry, I couldn't generate a summary right now.");
    } catch (error) {
      console.error("Summary Error:", error);
      updateAiMessage(aiMsgId, "Maafi chahte hain, summarization failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVideo = async (originalMsg: Message, editPrompt: string, aspectRatio: '16:9' | '9:16') => {
    setView('chat');
    setIsLoading(true);
    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = { id: aiMsgId, role: Role.AI, content: 'Starting Bharat Studio Edit...', timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
    try {
      const videoUrl = await generateVideo(editPrompt, (msg) => updateAiMessage(aiMsgId, msg), originalMsg.videoUrl, aspectRatio);
      if (videoUrl) {
        updateAiMessage(aiMsgId, "Studio Edit Complete! Your refined cinematic vision is ready.", videoUrl, 'video-gen');
      } else {
        updateAiMessage(aiMsgId, "The studio edit failed. Please try again.");
      }
    } catch (error) {
      console.error("Edit Video Error:", error);
      updateAiMessage(aiMsgId, "Error during video editing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
        if (filtered.length === 0) {
          setTimeout(createNewChat, 0);
        }
      }
      return filtered;
    });
  };

  const handleDeleteVideo = (sessionId: string, messageId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      messages: s.messages.filter(m => m.id !== messageId)
    } : s));
  };

  const handleSubscribeSuccess = () => {
    setUserStats(prev => ({ ...prev, isSubscribed: true }));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      <Sidebar 
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={(id) => { 
          setActiveSessionId(id); 
          setView('chat'); 
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onNew={createNewChat}
        onDelete={handleDeleteSession}
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        view={view}
        setView={(v) => {
          setView(v);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        useSearch={useSearch}
        setUseSearch={setUseSearch}
        usePro={usePro}
        setUsePro={setUsePro}
        isSubscribed={userStats.isSubscribed}
        onUpgrade={() => setIsUpgradeOpen(true)}
      />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {view === 'chat' ? (
          <ChatWindow 
            messages={activeSession?.messages || []}
            onSend={handleSendMessage}
            onSummarize={handleSummarize}
            onEditMessage={handleEditMessage}
            isLoading={isLoading}
            userStats={userStats}
            onSubscribe={() => setIsUpgradeOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        ) : (
          <VideoGallery 
            sessions={sessions} 
            onEdit={handleEditVideo} 
            onDeleteVideo={handleDeleteVideo}
          />
        )}
      </main>

      <SubscriptionModal 
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onSuccess={handleSubscribeSuccess}
      />
    </div>
  );
};

export default App;
