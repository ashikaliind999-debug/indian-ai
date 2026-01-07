
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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, activeId, onSelect, onNew, onDelete, isOpen, toggle 
}) => {
  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} bg-slate-900 text-white flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xl">I</div>
          <span className="font-bold text-lg whitespace-nowrap">Indian AI</span>
        </div>
        <button onClick={toggle} className="p-1 hover:bg-slate-800 rounded">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="p-4">
        <button 
          onClick={onNew}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`group relative p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${activeId === session.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
          >
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="truncate text-sm font-medium flex-1 pr-6">{session.title}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Powered by Gemini 2.5 Flash
        </div>
        <p>© 2024 Indian AI Labs</p>
      </div>
    </aside>
  );
};
