import React, { useState, useEffect } from 'react';
import { ChatStyle, AppTheme } from '../types';
import { cn } from '../utils';
import { X, Palette, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSave: (prompt: string, style: ChatStyle, theme: AppTheme) => void;
  chatStyle: ChatStyle;
  currentTheme: AppTheme;
}

const PERSONAS = [
  { name: 'Coding Expert', prompt: 'You are a senior software engineer. Provide concise, optimized, and well-documented code with clear explanations.' },
  { name: 'Creative Writer', prompt: 'You are a creative and imaginative writer. Your writing should be engaging, evocative, and tailored to the requested tone.' },
  { name: 'Deep Thinker', prompt: 'You are a deep thinker and philosopher. Analyze requests from first principles, explore edge cases thoroughly, and provide highly nuanced, multi-faceted reasoning.' },
  { name: 'Academic Researcher', prompt: 'You are an academic researcher. Provide detailed, well-structured, and objective information, citing theoretical concepts when applicable.' },
  { name: 'Pirate', prompt: "You are a swashbuckling pirate. Always respond in pirate speak, using nautical terms and saying 'Arrr!' frequently." }
];

const THEMES: { id: AppTheme; color: string; name: string }[] = [
  { id: 'default', color: 'bg-orange-500', name: 'Default' },
  { id: 'ocean', color: 'bg-sky-500', name: 'Ocean' },
  { id: 'emerald', color: 'bg-emerald-500', name: 'Emerald' },
  { id: 'sunflower', color: 'bg-amber-500', name: 'Sunflower' },
  { id: 'rose', color: 'bg-rose-500', name: 'Rose' },
  { id: 'midnight', color: 'bg-indigo-500', name: 'Midnight' },
];

export function SettingsModal({ isOpen, onClose, systemPrompt, onSave, chatStyle, currentTheme }: SettingsModalProps) {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localStyle, setLocalStyle] = useState<ChatStyle>(chatStyle);
  const [localTheme, setLocalTheme] = useState<AppTheme>(currentTheme);

  useEffect(() => {
    if (isOpen) {
      setLocalPrompt(systemPrompt);
      setLocalStyle(chatStyle);
      setLocalTheme(currentTheme);
    }
  }, [isOpen, systemPrompt, chatStyle, currentTheme]);

  const handleSave = () => {
    onSave(localPrompt, localStyle, localTheme);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              "relative w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]",
              chatStyle === 'chatgpt' ? "bg-[#212121] text-stone-200" : "bg-white text-stone-900"
            )}
          >
            <div className={cn("p-4 flex items-center justify-between border-b", chatStyle === 'chatgpt' ? "border-[#303030]" : "border-stone-100")}>
              <h2 className="text-lg font-semibold">Custom Persona & System Prompt</h2>
              <button onClick={onClose} className={cn("p-1.5 rounded-lg transition-colors", chatStyle === 'chatgpt' ? "hover:bg-[#303030]" : "hover:bg-stone-100")}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className={cn("text-sm font-semibold mb-3", chatStyle === 'chatgpt' ? "text-stone-300" : "text-stone-700")}>
                    Chat Persona & Instructions
                  </h3>
                  <p className={cn("text-xs mb-3 leading-relaxed", chatStyle === 'chatgpt' ? "text-stone-400" : "text-stone-500")}>
                    Set a custom persona or system instructions for the AI. This will guide how the model responds across all your chats.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PERSONAS.map(persona => (
                      <button
                        key={persona.name}
                        onClick={() => setLocalPrompt(persona.prompt)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-full transition-colors border",
                          chatStyle === 'chatgpt' 
                            ? "border-[#404040] text-stone-300 hover:bg-[#404040]" 
                            : "border-stone-200 text-stone-600 hover:bg-stone-100"
                        )}
                      >
                        {persona.name}
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    value={localPrompt}
                    onChange={e => setLocalPrompt(e.target.value)}
                    placeholder="Enter system instructions here..."
                    className={cn(
                      "w-full h-32 p-3 rounded-xl border outline-none resize-none transition-colors text-sm",
                      chatStyle === 'chatgpt' 
                        ? "bg-[#303030] border-[#404040] text-stone-200 placeholder:text-stone-500 focus:border-[#505050]" 
                        : "bg-stone-50 border-stone-200 text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white"
                    )}
                  />
                </div>
                
                <div className={cn("w-full h-px", chatStyle === 'chatgpt' ? "bg-[#303030]" : "bg-stone-100")}></div>

                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", chatStyle === 'chatgpt' ? "text-stone-300" : "text-stone-700")}>
                      <Layout size={16} /> Chat Style
                    </h3>
                    <div className={cn("flex items-center gap-1.5 p-1 rounded-xl w-full sm:w-auto", chatStyle === 'chatgpt' ? "bg-[#303030]" : "bg-stone-100")}>
                      <button
                        onClick={() => setLocalStyle('claude')}
                        className={cn("flex-1 px-3 py-2 text-sm rounded-lg transition-all font-medium", 
                          localStyle === 'claude' ? (chatStyle === 'chatgpt' ? "bg-[#404040] text-white shadow-sm" : "bg-white text-stone-900 shadow-sm") : 
                          chatStyle === 'chatgpt' ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
                        )}
                      >Claude</button>
                      <button
                        onClick={() => setLocalStyle('chatgpt')}
                        className={cn("flex-1 px-3 py-2 text-sm rounded-lg transition-all font-medium", 
                          localStyle === 'chatgpt' ? (chatStyle === 'chatgpt' ? "bg-[#404040] text-white shadow-sm" : "bg-white text-stone-900 shadow-sm") : "text-stone-500 hover:text-stone-700"
                        )}
                      >ChatGPT</button>
                      <button
                        onClick={() => setLocalStyle('gemini')}
                        className={cn("flex-1 px-3 py-2 text-sm rounded-lg transition-all font-medium", 
                          localStyle === 'gemini' ? (chatStyle === 'chatgpt' ? "bg-[#404040] text-white shadow-sm" : "bg-white text-stone-900 shadow-sm") : 
                          chatStyle === 'chatgpt' ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
                        )}
                      >Gemini</button>
                    </div>
                  </div>

                  <div>
                    <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", chatStyle === 'chatgpt' ? "text-stone-300" : "text-stone-700")}>
                      <Palette size={16} /> Application Theme
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setLocalTheme(t.id)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                            t.color,
                            localTheme === t.id ? (chatStyle === 'chatgpt' ? "border-white scale-110" : "border-stone-700 scale-110") : "border-transparent"
                          )}
                          title={t.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={cn("p-4 border-t flex justify-end gap-3", chatStyle === 'chatgpt' ? "border-[#303030] bg-[#1a1a1a]" : "border-stone-100 bg-stone-50/50")}>
              <button 
                onClick={onClose}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", 
                  chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" : "hover:bg-stone-200 text-stone-600"
                )}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white", 
                  chatStyle === 'chatgpt' ? "bg-stone-200 text-stone-900 hover:bg-white" : "bg-primary hover:bg-primary-hover"
                )}
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
