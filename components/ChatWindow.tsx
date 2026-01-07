
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, UserStats } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
  useSearch: boolean;
  setUseSearch: (v: boolean) => void;
  usePro: boolean;
  setUsePro: (v: boolean) => void;
  userStats: UserStats;
  onSubscribe: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, onSend, isLoading, useSearch, setUseSearch, usePro, setUsePro, userStats, onSubscribe
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    onSend(input, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
  };

  const handleDownloadVideo = (url: string, content: string) => {
    const link = document.createElement('a');
    link.href = url;
    const slug = content.split('\n')[0].toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20) || 'video';
    link.download = `bharat-${slug}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col relative h-full w-full">
      <header className="px-6 py-4 flex items-center justify-between glass-card sticky top-0 z-10 border-b border-orange-100 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl shadow-sm p-1 bg-white rounded-lg md:hidden">🇮🇳</span>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg text-slate-800 tracking-tight">Indian AI</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-orange-600 uppercase">15s 3D Vision</span>
              {!userStats.isSubscribed ? (
                <span className="text-[10px] font-bold text-slate-400">Trial: {3 - userStats.videoTrialCount}/3</span>
              ) : (
                <span className="text-[10px] font-bold text-green-600">Premium Active</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Placeholder for center area to allow space for App.tsx flag on desktop */}
        <div className="hidden md:block w-20"></div>

        <div className="flex items-center gap-2">
           {!userStats.isSubscribed && userStats.videoTrialCount >= 3 && (
             <button onClick={onSubscribe} className="px-3 py-1.5 bg-orange-500 text-white text-[10px] font-black rounded-lg shadow-lg">UPGRADE</button>
           )}
           <button onClick={() => setUseSearch(!useSearch)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${useSearch ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>Web Search</button>
           <button onClick={() => setUsePro(!usePro)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${usePro ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>Pro Mode</button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bharat-bg scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="text-6xl mb-4 p-4 bg-white rounded-full shadow-xl border-4 border-orange-100 float-animation">🇮🇳</div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Jai Hind!</h2>
            <p className="text-slate-500 text-sm mb-8">Create 15-second 3D videos, generate photos, or chat with Bharat's smartest AI.</p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {['Make a video of a futuristic Mumbai', 'Generate a photo of a royal Indian tiger', 'Correct the lighting in the last image'].map(t => (
                <button key={t} onClick={() => setInput(t)} className="p-4 bg-white border border-orange-50 rounded-2xl text-xs font-bold text-slate-700 hover:border-orange-400 text-left shadow-sm">{t}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl ${msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white border border-orange-100 shadow-sm text-slate-800'}`}>
                {msg.videoUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden shadow-md bg-black aspect-video relative group">
                    <video src={msg.videoUrl} controls autoPlay loop className="w-full" />
                    <button 
                      onClick={() => handleDownloadVideo(msg.videoUrl!, msg.content)}
                      className="absolute top-2 right-2 p-2 bg-orange-500/80 hover:bg-orange-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold backdrop-blur-sm"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 4v11" /></svg>
                      Download
                    </button>
                  </div>
                )}
                {msg.imageUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden shadow-md relative group">
                    <img src={msg.imageUrl} className="w-full h-auto" />
                    <a 
                      href={msg.imageUrl} 
                      download="bharat-photo.png"
                      className="absolute top-2 right-2 p-2 bg-indigo-500/80 hover:bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold backdrop-blur-sm"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 4v11" /></svg>
                      Download
                    </a>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {msg.sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" className="text-[10px] px-2 py-1 bg-slate-50 text-blue-600 rounded-md border border-slate-100">Source {i+1}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex gap-1 items-center px-4"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-orange-200 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
      </div>

      <div className="p-4 bg-white/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2 bg-white p-2 rounded-2xl border-2 border-orange-100 shadow-lg">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-orange-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          {selectedFile && <div className="bg-orange-50 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2">Image Loaded <button onClick={() => setSelectedFile(null)}>×</button></div>}
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Make a 15s video or generate a photo..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold" />
          <button type="submit" disabled={isLoading} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 transition-all">Send</button>
        </form>
      </div>
    </div>
  );
};
