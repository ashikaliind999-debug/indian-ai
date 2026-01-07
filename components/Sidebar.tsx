
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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, activeId, onSelect, onNew, onDelete, isOpen, toggle, view, setView
}) => {
  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} bg-white border-r border-orange-100 flex flex-col transition-all duration-300 overflow-hidden shrink-0 z-20`}>
      <div className="p-4 flex items-center justify-between border-b border-orange-50 bg-orange-50/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl shadow-sm rounded-md overflow-hidden">🇮🇳</span>
          <span className="font-bold text-lg whitespace-nowrap bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">Indian AI</span>
        </div>
        <button onClick={toggle} className="p-2 hover:bg-orange-100 rounded-full transition-colors text-orange-600">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="p-4 space-y-2">
        <button 
          onClick={onNew}
          className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-white ${view === 'chat' ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/20' : 'bg-slate-400 opacity-80'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Bharat Chat
        </button>
        <button 
          onClick={() => setView('gallery')}
          className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-white ${view === 'gallery' ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20' : 'bg-slate-400 opacity-80'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Video Gallery
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`group relative p-4 rounded-2xl cursor-pointer flex items-center gap-3 transition-all border ${activeId === session.id && view === 'chat' ? 'bg-orange-50 border-orange-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeId === session.id && view === 'chat' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
            <span className={`truncate text-sm font-semibold flex-1 pr-6 ${activeId === session.id && view === 'chat' ? 'text-orange-900' : 'text-slate-600'}`}>{session.title}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
              className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-orange-50 bg-slate-50/50 text-[10px] text-slate-400 space-y-2 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Bharat Powered Engine Active
        </div>
        <p className="flex justify-between"><span>v2.5 Release</span> <span>© Indian AI Labs</span></p>
      </div>
    </aside>
  );
};
