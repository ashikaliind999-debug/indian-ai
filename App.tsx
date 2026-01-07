
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
  const [userStats, setUserStats] = useState<UserStats>({ videoTrialCount: 0, isSubscribed: false });
  const [view, setView] = useState<'chat' | 'gallery'>('chat');

  // Fix: Added missing createNewChat function to resolve "Cannot find name 'createNewChat'"
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
    if (savedStats) setUserStats(JSON.parse(savedStats));
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

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!activeSessionId) return;
    const trimmedText = text.trim();
    if (!trimmedText && !imageFile) return;

    setIsLoading(true);
    let userImageUrl: string | undefined;
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    if (imageFile) {
      const readerResult = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
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

    try {
      const isMediaRequest = /video|image|photo|picture|render|make|create/i.test(text);
      
      if (isMediaRequest && text.toLowerCase().includes('video')) {
         if (!userStats.isSubscribed && userStats.videoTrialCount >= 3) {
            updateAiMessage(aiMsgId, "You've reached the trial limit for videos. Please upgrade to continue creating cinematic visions!");
            setIsLoading(false);
            return;
         }
         
         if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
           await window.aistudio.openSelectKey();
         }

         const videoUrl = await generateVideo(text, (msg) => updateAiMessage(aiMsgId, msg));
         if (videoUrl) {
           setUserStats(prev => ({ ...prev, videoTrialCount: prev.videoTrialCount + 1 }));
           updateAiMessage(aiMsgId, "Bharat Studio has rendered your 15s cinematic vision!", videoUrl, 'video-gen');
         } else {
           updateAiMessage(aiMsgId, "I encountered an error while rendering the video. Please try again.");
         }
      } else if (isMediaRequest && (text.toLowerCase().includes('image') || text.toLowerCase().includes('photo'))) {
         const imageUrl = await generateImage(text, userImageUrl);
         if (imageUrl) {
           updateAiMessage(aiMsgId, "Here is the visual interpretation I created for you.", imageUrl, 'image-gen');
         } else {
           updateAiMessage(aiMsgId, "I couldn't generate the image right now. Let's try chatting instead.");
         }
      } else if (base64Data && mimeType) {
        const analysis = await analyzeImage(base64Data, mimeType, text || "Describe this image in detail.");
        updateAiMessage(aiMsgId, analysis || "I've analyzed the image.");
      } else {
        const history = activeSession?.messages || [];
        const { fullText, sources } = await chatStream(text, history, (chunk) => {
          updateAiMessage(aiMsgId, prev => prev + chunk);
        }, { useSearch, usePro });
        
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: fullText, sources } : m)
        } : s));
      }
    } catch (error: any) {
      if (error.message === 'KEY_RESET' && window.aistudio) {
        await window.aistudio.openSelectKey();
        updateAiMessage(aiMsgId, "API Key was reset. Please try sending your request again.");
      } else {
        updateAiMessage(aiMsgId, "I'm sorry, I'm having trouble connecting right now. Please try again later.");
      }
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      <Sidebar 
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={(id) => { setActiveSessionId(id); setView('chat'); }}
        onNew={createNewChat}
        onDelete={handleDeleteSession}
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        view={view}
        setView={setView}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
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
            onSubscribe={() => setUserStats(prev => ({ ...prev, isSubscribed: true }))}
          />
        ) : (
          <VideoGallery sessions={sessions} onEdit={handleEditVideo} />
        )}
      </main>
    </div>
  );
};

// Fix: Added missing default export to resolve index.tsx error
export default App;
