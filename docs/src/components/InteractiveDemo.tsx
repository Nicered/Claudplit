'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle2, FileText, Terminal } from 'lucide-react';
import { type Locale, getTranslations } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: { name: string; file?: string }[];
}

const demoResponses: Record<Locale, Record<string, { text: string; tools: { name: string; file?: string }[] }>> = {
  en: {
    'todo': {
      text: "I'll create a todo app with add and delete functionality. Let me set up the components and styling.",
      tools: [
        { name: 'Write', file: 'src/app/page.tsx' },
        { name: 'Write', file: 'src/components/TodoList.tsx' },
        { name: 'Write', file: 'src/components/TodoItem.tsx' },
        { name: 'Bash', file: 'npm install' },
      ],
    },
    'dark': {
      text: "I'll add a dark mode toggle to your app using CSS variables and a theme context.",
      tools: [
        { name: 'Write', file: 'src/lib/theme.tsx' },
        { name: 'Edit', file: 'src/app/layout.tsx' },
        { name: 'Write', file: 'src/components/ThemeToggle.tsx' },
      ],
    },
    'default': {
      text: "I understand what you want to build. Let me create the necessary files and components for you.",
      tools: [
        { name: 'Read', file: 'package.json' },
        { name: 'Write', file: 'src/app/page.tsx' },
        { name: 'Write', file: 'src/components/App.tsx' },
      ],
    },
  },
  ko: {
    'todo': {
      text: "추가 및 삭제 기능이 있는 할 일 앱을 만들겠습니다. 컴포넌트와 스타일링을 설정하겠습니다.",
      tools: [
        { name: 'Write', file: 'src/app/page.tsx' },
        { name: 'Write', file: 'src/components/TodoList.tsx' },
        { name: 'Write', file: 'src/components/TodoItem.tsx' },
        { name: 'Bash', file: 'npm install' },
      ],
    },
    'dark': {
      text: "CSS 변수와 테마 컨텍스트를 사용하여 다크 모드 토글을 추가하겠습니다.",
      tools: [
        { name: 'Write', file: 'src/lib/theme.tsx' },
        { name: 'Edit', file: 'src/app/layout.tsx' },
        { name: 'Write', file: 'src/components/ThemeToggle.tsx' },
      ],
    },
    'default': {
      text: "무엇을 만들고 싶은지 이해했습니다. 필요한 파일과 컴포넌트를 만들어 드리겠습니다.",
      tools: [
        { name: 'Read', file: 'package.json' },
        { name: 'Write', file: 'src/app/page.tsx' },
        { name: 'Write', file: 'src/components/App.tsx' },
      ],
    },
  },
};

function getResponse(input: string, locale: Locale) {
  const lower = input.toLowerCase();
  if (lower.includes('todo') || lower.includes('할 일')) {
    return demoResponses[locale]['todo'];
  }
  if (lower.includes('dark') || lower.includes('다크')) {
    return demoResponses[locale]['dark'];
  }
  return demoResponses[locale]['default'];
}

interface InteractiveDemoProps {
  locale: Locale;
}

export function InteractiveDemo({ locale }: InteractiveDemoProps) {
  const t = getTranslations(locale);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentToolIndex, setCurrentToolIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolIndex]);

  const simulateResponse = async (userInput: string) => {
    const response = getResponse(userInput, locale);

    // Add assistant message
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.text,
      tools: response.tools,
    };

    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);

    // Simulate tool execution
    for (let i = 0; i < response.tools.length; i++) {
      setCurrentToolIndex(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setCurrentToolIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    await simulateResponse(input.trim());
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'Write':
      case 'Edit':
        return <FileText className="w-3 h-3" />;
      case 'Bash':
        return <Terminal className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-slate-500 ml-2">ClaudeShip Demo</span>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            {t.demo.placeholder}
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, msgIndex) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                }`}
              >
                {message.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm">
                  {message.content}
                </div>

                {/* Tools */}
                {message.tools && msgIndex === messages.length - 1 && (
                  <div className="space-y-1">
                    {message.tools.map((tool, toolIndex) => (
                      <motion.div
                        key={toolIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: toolIndex * 0.1 }}
                        className={`flex items-center gap-2 text-xs p-2 rounded-md ${
                          currentToolIndex === toolIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : currentToolIndex > toolIndex
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'
                        }`}
                      >
                        {currentToolIndex === toolIndex ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : currentToolIndex > toolIndex ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          getToolIcon(tool.name)
                        )}
                        <span className="font-medium">{tool.name}</span>
                        {tool.file && <span className="text-slate-400">{tool.file}</span>}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs text-green-700 dark:text-green-300">
              AI
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.demo.typing}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.demo.placeholder}
            disabled={isTyping}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
