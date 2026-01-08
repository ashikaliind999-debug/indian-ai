
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  toggle: () => void;
  view: 'chat' | 'gallery';
  setView: (v: 'chat' | 'gallery') => void;
  useSearch: boolean;
  setUseSearch: (v: boolean) => void;
  usePro: boolean;
  setUsePro: (v: boolean) => void;
  isSubscribed: boolean;
  onUpgrade: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, activeId, onSelect, onNew, onDelete, isOpen, toggle, view, setView,
  useSearch, setUseSearch, usePro, setUsePro, isSubscribed, onUpgrade
}) => {
  return (
    <aside className={`fixed inset-y-0 left-0 lg:static z-20 ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0 lg:w-0'} bg-white border-r border-orange-100 flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
      <div className="p-5 flex items-center justify-between border-b border-orange-50 bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-md border border-slate-100 flex-shrink-0 flag-pulse">
            <svg viewBox="0 0 900 600" className="w-full h-full">
              <rect width="900" height="600" fill="#FF9933"/>
              <rect width="900" height="200" y="200" fill="#FFFFFF"/>
              <rect width="900" height="200" y="400" fill="#128807"/>
              <g transform="translate(450,300)">
                <circle r="92.5" fill="none" stroke="#000080" stroke-width="5"/>
                <circle r="15" fill="#000080"/>
                <g id="d">
                  <g id="c">
                    <g id="b">
                      <g id="a">
                        <circle r="4" fill="#000080" transform="rotate(7.5) translate(0,-92.5)"/>
                        <path fill="#000080" d="M0,0 L1.5,-90 L0,-92.5 L-1.5,-90 Z"/>
                      </g>
                      <use href="#a" transform="rotate(15)"/>
                    </g>
                    <use href="#b" transform="rotate(30)"/>
                  </g>
                  <use href="#c" transform="rotate(60)"/>
                </g>
                <use href="#d" transform="rotate(120)"/>
                <use href="#d" transform="rotate(240)"/>
              </g>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl whitespace-nowrap bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent tracking-tighter uppercase leading-none">Indian AI</span>
            {isSubscribed && <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Premium Vision Active</span>}
          </div>
        </div>
        <button onClick={toggle} className="p-2 hover:bg-orange-50 rounded-full transition-colors text-orange-400 lg:hidden">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Tools Section */}
        <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-100">
           <h4 className="px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Engine Controls {isSubscribed && '✨'}</h4>
           <button 
             onClick={() => setUseSearch(!useSearch)}
             className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${useSearch ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-white/50 border border-slate-200'}`}
           >
             <span className="text-[11px] font-black uppercase tracking-wider">Web Search</span>
             <div className={`w-8 h-4 rounded-full relative transition-colors ${useSearch ? 'bg-blue-400' : 'bg-slate-300'}`}>
               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useSearch ? 'left-4.5' : 'left-0.5'}`} />
             </div>
           </button>
           <button 
             disabled={!isSubscribed}
             onClick={() => setUsePro(!usePro)}
             className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${isSubscribed ? (usePro ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-white/50 border border-slate-200') : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400'}`}
           >
             <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">Pro Mode {!isSubscribed && '🔒'}</span>
             {isSubscribed && (
               <div className={`w-8 h-4 rounded-full relative transition-colors ${usePro ? 'bg-indigo-400' : 'bg-slate-300'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${usePro ? 'left-4.5' : 'left-0.5'}`} />
               </div>
             )}
           </button>
        </div>

        {!isSubscribed && (
          <button 
            onClick={onUpgrade}
            className="w-full py-3 px-4 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] tracking-widest transition-all hover:bg-orange-500 hover:text-white uppercase shadow-sm"
          >
            Upgrade to Pro Vision
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        )}

        <button 
          onClick={onNew}
          className={`w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-xl text-white ${view === 'chat' ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20' : 'bg-slate-300'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          NEW CHAT
        </button>
        <button 
          onClick={() => setView('gallery')}
          className={`w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-xl text-white ${view === 'gallery' ? 'bg-gradient-to-br from-green-600 to-emerald-700 shadow-green-600/20' : 'bg-slate-300'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          VIDEO GALLERY
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar">
        <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">History</h4>
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`group relative p-4 rounded-2xl cursor-pointer flex items-center gap-3 transition-all border-2 ${activeId === session.id && view === 'chat' ? 'bg-orange-50 border-orange-100 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeId === session.id && view === 'chat' ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`}></div>
            <span className={`truncate text-xs font-black flex-1 pr-6 ${activeId === session.id && view === 'chat' ? 'text-orange-900' : 'text-slate-500'}`}>{session.title.toUpperCase()}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
              className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-orange-50 bg-slate-50/50 text-[10px] text-slate-400 font-bold">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Bharat Engine: Online
        </div>
        <p className="flex justify-between items-center opacity-60">
          <span>v2.5 Stable</span>
          <span>© 2024 Indian AI</span>
        </p>
      </div>
    </aside>
  );
};
