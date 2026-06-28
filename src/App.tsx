import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { HeaderModelSelector } from './components/HeaderModelSelector';
import { ChatSession, Message, ModelType, AppTheme, Attachment } from './types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from './utils';
import { useAuth } from './components/AuthProvider';
import { subscribeToSessions, saveSession, deleteSession } from './lib/api';

export default function App() {
  const { user, signIn, loading } = useAuth();
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('nova_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToSessions(user.uid, (data) => {
      setSessions(data);
      if (data.length > 0 && !activeSessionId && data.find(s => s.id === activeSessionId) === undefined) {
        setActiveSessionId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  const [model, setModel] = useState<ModelType>('gemini-2.0-flash');
  const [thinking, setThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nova_theme') as AppTheme) || 'default';
  });
  const [chatStyle, setChatStyle] = useState<import('./types').ChatStyle>(() => {
    return (localStorage.getItem('nova_chat_style') as import('./types').ChatStyle) || 'claude';
  });

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Persistence fallback for local user
  useEffect(() => {
    if (!user) {
      localStorage.setItem('nova_sessions', JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    localStorage.setItem('nova_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nova_chat_style', chatStyle);
  }, [chatStyle]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      updatedAt: Date.now(),
      messages: []
    };
    
    if (user) {
      saveSession(user.uid, newSession);
    } else {
      setSessions([newSession, ...sessions]);
    }
    
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Create initial chat if none exists and not loading user
  useEffect(() => {
    if (!loading && sessions.length === 0) {
      handleNewChat();
    } else if (!loading && !activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [loading, sessions.length]);

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    let currentSessionId = activeSessionId;
    let newSessionObj = sessions.find(s => s.id === currentSessionId);
    
    if (!currentSessionId || !newSessionObj) {
      currentSessionId = uuidv4();
      newSessionObj = { id: currentSessionId, title: content.slice(0, 30) || 'New Chat', updatedAt: Date.now(), messages: [] };
      if (user) {
        await saveSession(user.uid, newSessionObj);
      } else {
        setSessions(prev => [newSessionObj!, ...prev]);
      }
      setActiveSessionId(currentSessionId);
    } else if (newSessionObj.messages.length === 0) {
      newSessionObj = { ...newSessionObj, title: content.slice(0, 30) || 'New Chat', updatedAt: Date.now() };
    }

    const userMessage: Message = { id: uuidv4(), role: 'user', content, attachments, timestamp: Date.now() };
    const modelMessageId = uuidv4();
    const tempModelMessage: Message = { id: modelMessageId, role: 'model', content: '', timestamp: Date.now() + 1 };

    newSessionObj = { ...newSessionObj, messages: [...newSessionObj.messages, userMessage, tempModelMessage], updatedAt: Date.now() };
    
    if (user) {
      await saveSession(user.uid, newSessionObj);
    } else {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? newSessionObj! : s));
    }

    try {
      // Need to omit tempMessage from sending to API
      const messagesToSend = newSessionObj.messages.slice(0, -1);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          model,
          thinking
        })
      });

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              if (user) {
                // Final save with updated text
                saveSession(user.uid, {
                   ...newSessionObj,
                   messages: newSessionObj.messages.map(m => m.id === modelMessageId ? { ...m, content: fullText } : m),
                   updatedAt: Date.now()
                });
              }
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                fullText += `\n\n**Error**: ${data.error}`;
              } else if (data.text) {
                fullText += data.text;
              }
              
              if (!user) {
                setSessions(prev => prev.map(s => {
                  if (s.id === currentSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m => m.id === modelMessageId ? { ...m, content: fullText } : m)
                    };
                  }
                  return s;
                }));
              }
            } catch (e) {
              console.error('Error parsing SSE data', e, dataStr);
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorSession = {
        ...newSessionObj,
        messages: newSessionObj.messages.map(m => m.id === modelMessageId ? { ...m, content: `Error: ${error.message || 'Connection failed'}` } : m),
        updatedAt: Date.now()
      };
      
      if (user) saveSession(user.uid, errorSession);
      else setSessions(prev => prev.map(s => s.id === currentSessionId ? errorSession : s));
    }
  };

  return (
    <div className={`flex h-[100dvh] w-full bg-stone-50 overflow-hidden text-stone-900 relative ${theme !== 'default' ? `theme-${theme}` : ''}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={id => {
          setActiveSessionId(id);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={id => {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (activeSessionId === id) setActiveSessionId(null);
        }}
        currentTheme={theme}
        onThemeChange={setTheme}
        currentStyle={chatStyle}
        onStyleChange={setChatStyle}
      />
      
      <main className={cn(
        "flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 overflow-hidden",
        chatStyle === 'chatgpt' ? "bg-[#212121]" :
        chatStyle === 'gemini' ? "bg-white" :
        "bg-stone-50"
      )}>
        {/* Header */}
        <header className={cn(
          "absolute top-0 left-0 right-0 h-24 flex items-start pt-4 px-4 shrink-0 z-20 pointer-events-none",
          chatStyle === 'chatgpt' ? "bg-gradient-to-b from-[#212121] via-[#212121]/80 to-transparent" :
          chatStyle === 'gemini' ? "bg-gradient-to-b from-white via-white/80 to-transparent" :
          "bg-gradient-to-b from-stone-50 via-stone-50/80 to-transparent"
        )}>
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-2 -ml-2 rounded-xl transition-colors mr-3 pointer-events-auto",
                chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" :
                chatStyle === 'gemini' ? "hover:bg-stone-100 text-stone-600" :
                "hover:bg-stone-200/50 text-stone-600"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}
          
          <div className="flex-1 flex items-center pointer-events-auto">
            <HeaderModelSelector 
              model={model} 
              setModel={setModel} 
              thinking={thinking} 
              setThinking={setThinking} 
            />
          </div>
          
          <div className="ml-auto flex items-center gap-2 pl-2 shrink-0 pointer-events-auto">
            <button className={cn("p-2 rounded-xl transition-colors hidden sm:flex", 
              chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" :
              chatStyle === 'gemini' ? "hover:bg-stone-100 text-stone-600" :
              "hover:bg-stone-200/50 text-stone-600"
            )}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>
            </button>
            <button className={cn("p-2 rounded-xl transition-colors", 
              chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" :
              chatStyle === 'gemini' ? "hover:bg-stone-100 text-stone-600" :
              "hover:bg-stone-200/50 text-stone-600"
            )}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </header>

        <ChatArea 
          messages={messages} 
          onSendMessage={handleSendMessage}
          chatStyle={chatStyle}
        />
      </main>
    </div>
  );
}
