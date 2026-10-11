import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { apiRequest } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  links?: { title: string; id: string; url?: string }[];
}

const AIAssistantWidget: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: language === 'kk' 
        ? 'Сәлеметсіз бе! Мен КИнЭС AI көмекшісімін. Рекордтар туралы сұрақ қойыңыз немесе өтінім беруге көмектесейін!'
        : language === 'ru'
        ? 'Здравствуйте! Я AI-ассистент КИнЭС. Задайте вопрос о рекордах или я помогу вам подать заявку!'
        : 'Hello! I am the KIES AI assistant. Ask about records or let me help you submit an application!',
    },
  ]);

  // Автоматический скролл вниз при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
  
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
  
    try {
      const data = await apiRequest<{ reply: string; relevantLinks?: { title: string; id: string; url?: string }[] }>(
        '/api/assistant/chat',
        {
          method: 'POST',
          body: {
            message: currentInput,
            language,
            messages: messages.map(m => ({ role: m.role, content: m.content }))
          },
        },
      );
  
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        links: data.relevantLinks 
      };
  
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI Error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'ru' 
          ? 'Извините, произошла ошибка. Попробуйте позже.' 
          : 'Кешіріңіз, қате кетті. Кейінірек қайталаңыз.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? {} : { y: [0, -5, 0] }}
        transition={{ repeat: isOpen ? 0 : Infinity, duration: 2 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-secondary-foreground" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] bg-card rounded-2xl shadow-elevated border border-border overflow-hidden flex flex-col"
          >
            <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">{t('aiAssistant')}</h3>
                <p className="text-xs opacity-80">Онлайн</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-secondary' : 'bg-primary/10 text-primary'}`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[250px] p-3 rounded-2xl text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="whitespace-pre-line">{message.content}</p>
                      {message.links && (
                        <div className="mt-2 space-y-1 border-t border-primary/20 pt-1">
                          {message.links.map((link) => (
                            <Link key={link.id} to={link.url || `/records?q=${encodeURIComponent(link.title)}`} className="block text-xs font-medium underline hover:text-primary transition-colors">
                              → {link.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse"><Bot className="w-4 h-4" /></div>
                    <div className="bg-muted rounded-2xl p-3 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 border-t flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('askQuestion')} className="flex-1" />
              <Button type="submit" size="icon" disabled={isTyping}><Send className="w-4 h-4" /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistantWidget;
