
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SearchResult } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  currentContext?: SearchResult | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Assistant active. Need help refining structural logic?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null);

  useEffect(() => {
    chatInstance.current = null;
    if (currentContext) {
      setMessages([{ id: Date.now().toString(), role: 'model', text: `I've analyzed the "${currentContext.title}" structure. Ready for refinements.` }]);
    }
  }, [currentContext?.title]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const initChat = () => {
    if (!chatInstance.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatInstance.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are the JSON Prompter Assistant. Expert in data schemas and prompt engineering. Focus on structural integrity. Page context: ${currentContext ? JSON.stringify({ title: currentContext.title, prompt: currentContext.jsonPrompt }) : 'No active context.'}`,
        },
      });
    }
    return chatInstance.current;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const messageId = Date.now().toString();
    setInput('');
    setMessages(prev => [...prev, { id: messageId, role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const chat = initChat();
      const result = await chat.sendMessageStream({ message: userMessage });
      
      let fullResponse = '';
      const responseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: responseId, role: 'model', text: '' }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || '';
        fullResponse += textChunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: 'Logic trace failed.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-10 right-4 sm:right-10 z-[200] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 sm:mb-6 w-[calc(100vw-2rem)] sm:w-[450px] h-[75vh] sm:h-[600px] bg-[#111] border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
          {/* Header */}
          <div className="p-6 sm:p-8 bg-purple-600 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 text-white">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <i className="fas fa-microchip"></i>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest">Architect</h4>
                <p className="text-[8px] sm:text-[9px] opacity-70 font-black uppercase tracking-[0.2em]">Logic Trace Mode</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8 scrollbar-thin bg-black/50"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`relative group max-w-[90%] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] text-[12px] sm:text-[13px] leading-relaxed shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : 'bg-[#222] text-gray-100 border border-white/5 rounded-tl-none'
                  }`}
                >
                  {msg.text || (msg.role === 'model' && isTyping && <span className="animate-pulse">Tracing...</span>)}
                  
                  {msg.role === 'model' && msg.text && !isTyping && (
                    <button 
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className={`absolute -bottom-7 right-0 text-[9px] font-black uppercase tracking-widest transition-all ${copiedId === msg.id ? 'text-green-400' : 'text-gray-600 hover:text-white'}`}
                    >
                       <i className={`fas ${copiedId === msg.id ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                       {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-6 sm:p-8 border-t border-white/5 bg-[#0a0a0a]">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Refine structure..."
                className="w-full bg-[#151515] border border-white/5 rounded-2xl py-3.5 sm:py-4.5 pl-5 sm:pl-6 pr-12 sm:pr-14 text-xs sm:text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-600 transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-3 top-2 bottom-2 w-10 flex items-center justify-center text-purple-500 hover:text-white disabled:text-gray-800 transition-all"
              >
                <i className="fas fa-paper-plane text-base"></i>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brighter Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group ${
          isOpen ? 'bg-[#222] rotate-90' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'
        }`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-wand-magic-sparkles'} text-xl sm:text-2xl`}></i>
      </button>
    </div>
  );
};

export default ChatWidget;
