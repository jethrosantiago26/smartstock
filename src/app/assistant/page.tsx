'use client'

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';

type Message = { id: string, role: 'user' | 'assistant', content: string };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am SmartStock AI. I have full access to your real-time database. You can ask me things like "What do I need to reorder?", "Which items cost the most?", or "Analyze our recent transaction history."' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          conversationHistory: newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        
        setMessages(curr => [...curr, { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }]);
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          
          setMessages(curr => {
            const updated = [...curr];
            updated[updated.length - 1].content = assistantContent;
            return updated;
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      const isOverloaded = error.message?.includes('503') || error.message?.toLowerCase().includes('demand');
      const errorMsg = isOverloaded 
        ? 'The AI model is currently experiencing high demand. Please try asking again in a moment.' 
        : 'Sorry, I encountered an error communicating with the API. Please ensure GEMINI_API_KEY is configured correctly.';
      setMessages(curr => [...curr, { id: Date.now().toString(), role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex justify-center w-full">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center shrink-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">SmartStock AI</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-indigo-400">Powered by Google Gemini</p>
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-slate-50/30 dark:bg-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end group`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' 
                    ? 'ml-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                    : 'mr-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm prose dark:prose-invert max-w-none prose-sm prose-p:my-1 prose-ul:my-1'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row items-end">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mr-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-sm flex space-x-2 items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your inventory, anomalies, or ordering suggestions..."
              disabled={isLoading}
              className="w-full pl-5 pr-14 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-200 placeholder-slate-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-600/50 text-white rounded-lg transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">AI Assistant may produce inaccurate information occasionally. Verify stock levels via Inventory tab.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
