"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import api from "@/lib/axios";

interface Message {
  text: string;
  isUser: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I'm your EventHive AI assistant. How can I help you find the perfect event today?", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setLoading(true);

    try {
      // Calling the backend AI endpoint
      const res = await api.post("/ai/chat", { message: userMessage });
      const aiResponse = res.data.reply || "I couldn't process that. Try asking about events this weekend!";
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now. Please try again later.", isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] glass-card border border-border rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden bg-background"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-bold">AI Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask me anything..." 
                  className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary border border-border"
                />
                <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
