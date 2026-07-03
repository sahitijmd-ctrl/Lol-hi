import React, { useState } from 'react';
import { ChatSession, AppTheme, ChatStyle } from '../types';
import { cn } from '../utils';
import { MessageSquare, Plus, PanelLeftClose, Trash2, Palette, Layout, LogIn, LogOut, User, Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  currentStyle: ChatStyle;
  onStyleChange: (style: ChatStyle) => void;
  onOpenSettings: () => void;
}

const THEMES: { id: AppTheme; color: string }[] = [
  { id: 'default', color: 'bg-orange-500' },
  { id: 'ocean', color: 'bg-sky-500' },
  { id: 'emerald', color: 'bg-emerald-500' },
  { id: 'sunflower', color: 'bg-amber-500' },
  { id: 'rose', color: 'bg-rose-500' },
  { id: 'midnight', color: 'bg-indigo-500' },
];

export function Sidebar({ isOpen, onClose, sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, currentTheme, onThemeChange, currentStyle, onStyleChange, onOpenSettings }: SidebarProps) {
  const { user, signIn, logOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/20 z-40 md:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 w-72 flex flex-col shrink-0 h-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        isOpen ? "translate-x-0" : "-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden md:opacity-0",
        currentStyle === 'chatgpt' ? "bg-[#171717] text-stone-200 border-r-0" :
        currentStyle === 'gemini' ? "bg-[#f0f4f9] text-[#1f1f1f] border-r border-transparent" :
        "bg-stone-100 text-stone-900 border-r border-stone-200/60"
      )}>
        <div className="w-72 h-full flex flex-col">
          <div className="p-3 pb-2 flex items-center justify-between">
            <button 
              onClick={onClose}
              className={cn("p-2 rounded-xl transition-colors", currentStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" : currentStyle === 'gemini' ? "hover:bg-stone-200/60 text-stone-700" : "hover:bg-stone-200 text-stone-600")}
              title="Close sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
            <button 
              onClick={onNewChat}
              className={cn("p-2 rounded-xl transition-colors flex items-center gap-1.5", currentStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" : currentStyle === 'gemini' ? "hover:bg-stone-200/60 text-stone-700" : "hover:bg-stone-200 text-stone-600")}
              title="New chat"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className={cn("flex items-center px-2 py-1.5 rounded-lg border", 
                currentStyle === 'chatgpt' ? "bg-[#212121] border-[#303030] text-stone-300" : 
                currentStyle === 'gemini' ? "bg-white/50 border-stone-200/50 text-stone-700" : 
                "bg-white border-stone-200 text-stone-700"
              )}>
              <Search size={14} className={cn(currentStyle === 'chatgpt' ? "text-stone-400" : "text-stone-400")} />
              <input 
                type="text" 
                placeholder="Search chats..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("bg-transparent border-none outline-none text-sm w-full ml-2",
                  currentStyle === 'chatgpt' ? "placeholder:text-stone-500" : "placeholder:text-stone-400"
                )}
              />
            </div>
          </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className={cn("text-xs font-medium mb-2 px-2 uppercase tracking-wider", currentStyle === 'chatgpt' ? "text-stone-500" : "text-stone-500")}>Recent Chats</div>
        <AnimatePresence>
          {filteredSessions.map(session => (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              key={session.id}
              className={cn(
                "group flex items-center justify-between px-2 py-2.5 rounded-xl cursor-pointer transition-colors relative",
                activeSessionId === session.id 
                  ? currentStyle === 'chatgpt' ? "bg-[#212121] text-stone-100" : currentStyle === 'gemini' ? "bg-[#d3e3fd] text-[#001d35]" : "bg-stone-200/80 text-stone-900"
                  : currentStyle === 'chatgpt' ? "hover:bg-[#212121] text-stone-300" : currentStyle === 'gemini' ? "hover:bg-stone-200/50 text-stone-800" : "hover:bg-stone-200/50 text-stone-700"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeSessionId === session.id ? (currentStyle === 'chatgpt' ? "text-stone-100" : currentStyle === 'gemini' ? "text-[#001d35]" : "text-stone-700") : "text-stone-400"} />
                <span className="truncate text-sm font-medium">{session.title}</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className={cn("opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all absolute right-2", currentStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-400 hover:text-red-400" : "hover:bg-white/80 text-stone-500 hover:text-red-500")}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {sessions.length === 0 && (
          <div className={cn("text-sm px-2 py-4", currentStyle === 'chatgpt' ? "text-stone-500" : "text-stone-500")}>No recent chats.</div>
        )}
        {sessions.length > 0 && filteredSessions.length === 0 && (
          <div className={cn("text-sm px-2 py-4", currentStyle === 'chatgpt' ? "text-stone-500" : "text-stone-500")}>No chats found.</div>
        )}
      </div>
      
      <div className={cn("p-4 border-t flex flex-col gap-4", currentStyle === 'chatgpt' ? "border-[#303030]" : currentStyle === 'gemini' ? "border-transparent" : "border-stone-200/60")}>
        <button 
          onClick={onOpenSettings}
          className={cn("w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border",
            currentStyle === 'chatgpt' ? "bg-[#303030] hover:bg-[#404040] text-stone-300 border-transparent" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
          )}
        >
          <Settings size={16} /> Application Settings
        </button>

        <div className={cn("text-xs flex flex-col gap-2 p-2.5 rounded-xl border", 
          currentStyle === 'chatgpt' ? "bg-[#212121] border-[#303030] text-stone-400" : 
          currentStyle === 'gemini' ? "bg-white/50 border-stone-200/30 text-stone-600" : 
          "bg-white/50 border-stone-200/50 text-stone-500")}>
          <div className="flex justify-between items-center w-full">
            <span className="font-medium">Nova Chat Enterprise</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
          </div>
          
          <div className="w-full h-px bg-stone-200/30 my-1"></div>
          
          {user ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-stone-200/50 flex flex-shrink-0 items-center justify-center">
                  <User size={12} />
                </div>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <button onClick={logOut} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors" title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="flex items-center justify-center gap-2 w-full py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors font-medium">
              <LogIn size={14} /> Sign in
            </button>
          )}
        </div>
      </div>
        </div>
    </aside>
    </>
  );
}
