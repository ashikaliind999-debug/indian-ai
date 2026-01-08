
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, UserStats } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSend: (text: string, file?: File, preferredRatio?: string) => void;
  onSummarize: () => void;
  onEditMessage: (messageId: string, newText: string) => void;
  isLoading: boolean;
  userStats: UserStats;
  onSubscribe: () => void;
  onToggleSidebar: () => void;
}

const IndianFlagIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`${className} rounded-full overflow-hidden shadow-sm border border-slate-100 flex-shrink-0`}>
    <svg viewBox="0 0 900 600" className="w-full h-full scale-110">
      <rect width="900" height="600" fill="#FF9933"/>
      <rect width="900" height="200" y="200" fill="#FFFFFF"/>
      <rect width="900" height="200" y="400" fill="#128807"/>
      <g transform="translate(450,300)">
        <circle r="92.5" fill="none" stroke="#000080" strokeWidth="5"/>
        <circle r="15" fill="#000080"/>
        <g id="spokes">
          {Array.from({ length: 24 }).map((_, i) => (
            <g key={i} transform={`rotate(${i * 15})`}>
              <line x1="0" y1="0" x2="0" y2="-92.5" stroke="#000080" strokeWidth="2" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  </div>
);

const AshokChakra = () => (
  <div className="relative flex items-center justify-center mb-8 group">
    {/* Soft Glow Effect */}
    <div className="absolute inset-0 bg-orange-200/20 blur-3xl rounded-full scale-150 group-hover:bg-blue-200/30 transition-colors duration-1000"></div>
    
    <svg viewBox="0 0 200 200" className="w-32 h-32 md:w-40 md:h-40 relative z-10 animate-[spin_60s_linear_infinite]">
      <circle cx="100" cy="100" r="94" fill="none" stroke="#000080" strokeWidth="6" />
      <circle cx="100" cy="100" r="14" fill="#000080" />
      {Array.from({ length: 24 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 15}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="10" stroke="#000080" strokeWidth="3" />
          <path d="M97 18 L100 8 L103 18 Z" fill="#000080" />
          <circle cx="100" cy="10" r="2.5" fill="#000080" />
        </g>
      ))}
    </svg>
  </div>
);

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, onSend, onSummarize, onEditMessage, isLoading, userStats, onSubscribe, onToggleSidebar
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<string>("1:1");
  const [showRatios, setShowRatios] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    onSend(input, selectedFile || undefined, selectedRatio);
    setInput('');
    setSelectedFile(null);
    setShowRatios(false);
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.content);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editValue.trim()) {
      onEditMessage(editingMessageId, editValue.trim());
      setEditingMessageId(null);
    }
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
    <div className="flex-1 flex flex-col relative h-full w-full bg-white">
      <header className="px-4 lg:px-6 py-4 flex items-center justify-between glass-card sticky top-0 z-10 border-b border-orange-100 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="p-2.5 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-xl border border-slate-200 hover:border-orange-200 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <IndianFlagIcon className="w-8 h-8" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-slate-800 tracking-tight">Indian AI</h1>
                {!userStats.isSubscribed && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase">7 Free Images Daily</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-orange-600 uppercase">10s Studio 3D</span>
                {!userStats.isSubscribed ? (
                  <div className="flex gap-2">
                     <span className="text-[10px] font-bold text-slate-400">Vid: {userStats.dailyVideoCount || 0}/3</span>
                     <span className="text-[10px] font-bold text-slate-400">Img: {userStats.dailyImageCount || 0}/7</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-green-600">Premium Plan: Unlimited Vision</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {messages.length >= 2 && (
             <button 
               onClick={onSummarize} 
               disabled={isLoading}
               className="px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-200 hover:bg-green-100 transition-colors shadow-sm"
             >
               📝 Summarize
             </button>
           )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bharat-bg scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            
            <AshokChakra />

            <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Jai Hind!</h2>
            <p className="text-slate-500 text-sm mb-10 font-medium">Welcome to Indian AI. Enjoy 3 free videos and 7 free images every single day. Upgrade for unlimited creations!</p>
            
            <div className="grid grid-cols-1 gap-2.5 w-full">
              {['Who created you?', 'Make a 16:9 cinematic video of Ladakh', 'Generate a 9:16 portrait of a royal Bengal tiger'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setInput(t)} 
                  className="p-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/30 text-left shadow-sm transition-all hover:translate-x-1"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 group/msg`}>
            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === Role.USER ? 'items-end' : 'items-start'} relative`}>
              <div className={`px-4 py-3 rounded-2xl relative shadow-sm ${msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white border border-orange-100 text-slate-800'}`}>
                {msg.role === Role.USER && !editingMessageId && (
                  <button 
                    onClick={() => handleStartEdit(msg)}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-indigo-600 opacity-0 group-hover/msg:opacity-100 transition-all bg-white rounded-full shadow-md hover:scale-110"
                    title="Edit prompt"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                )}

                {editingMessageId === msg.id ? (
                  <div className="flex flex-col gap-3 min-w-[280px] md:min-w-[450px]">
                    <textarea 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm font-semibold focus:ring-2 focus:ring-white outline-none min-h-[100px] text-white"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white">Cancel</button>
                      <button onClick={handleSaveEdit} className="px-5 py-2 bg-white text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-transform">Save & Resend</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.videoUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden shadow-md bg-black relative group/vid">
                        <video src={msg.videoUrl} controls className="w-full max-h-[400px]" />
                        <button 
                          onClick={() => handleDownloadVideo(msg.videoUrl!, msg.content)}
                          className="absolute top-2 right-2 p-2 bg-orange-500/90 hover:bg-orange-600 text-white rounded-lg opacity-0 group-hover/vid:opacity-100 transition-all flex items-center gap-1 text-[9px] font-black backdrop-blur-sm"
                        >
                          DOWNLOAD VIDEO
                        </button>
                      </div>
                    )}
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden shadow-md relative group/img">
                        <img src={msg.imageUrl} className="w-full h-auto max-h-[500px] object-contain" />
                        <a 
                          href={msg.imageUrl} 
                          download="indian-ai-art.png"
                          className="absolute top-2 right-2 p-2 bg-indigo-500/90 hover:bg-indigo-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-all flex items-center gap-1 text-[9px] font-black backdrop-blur-sm"
                        >
                          SAVE ART
                        </a>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {msg.sources.map((s, i) => (
                          <a key={i} href={s.uri} target="_blank" className="text-[9px] px-2 py-1 bg-slate-50 text-blue-600 rounded-lg border border-slate-100 font-bold">SOURCE {i+1}</a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex gap-1.5 items-center px-4"><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-orange-200 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
      </div>

      <div className="p-4 bg-white/50 backdrop-blur-md border-t border-orange-50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowRatios(!showRatios)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-2 group ${showRatios ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-200'}`}
              title="Set Aspect Ratio"
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${showRatios ? 'rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              {showRatios ? (
                 <span className="text-[10px] font-black uppercase tracking-widest pr-1">Ratios</span>
              ) : (
                 <span className="text-[10px] font-black uppercase tracking-widest">{selectedRatio}</span>
              )}
            </button>

            {showRatios && (
              <div className="flex items-center bg-white border border-orange-100 p-1 rounded-xl shadow-xl animate-in slide-in-from-left-4 duration-300 gap-1 overflow-x-auto no-scrollbar">
                {["1:1", "16:9", "9:16", "4:3", "3:4"].map(r => (
                  <button 
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRatio(r); setShowRatios(false); }}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all flex-shrink-0 ${selectedRatio === r ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border-2 border-orange-100 shadow-xl relative">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-orange-500 transition-colors shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
            
            {selectedFile && (
              <div className="bg-orange-50 px-3 py-1.5 rounded-lg text-[10px] font-black text-orange-700 flex items-center gap-2 shrink-0 border border-orange-100 animate-in zoom-in-90">
                PHOTO READY 
                <button type="button" onClick={() => setSelectedFile(null)} className="hover:text-red-500 text-lg leading-none">×</button>
              </div>
            )}
            
            <div className="flex-1 relative flex items-center min-w-0">
              <IndianFlagIcon className="w-4 h-4 mr-2" />
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Message Indian AI or generate images..." 
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold pr-2 placeholder:text-slate-300" 
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className={`min-w-[80px] flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all shrink-0 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
              {isLoading ? "..." : "SEND"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
