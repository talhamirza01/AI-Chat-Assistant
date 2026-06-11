import { useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Trash2 } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { SidebarToggle } from '@/components/layout/Sidebar';

export function ChatPage() {
  const { chatId } = useParams();
  const { setSidebarOpen } = useOutletContext<{ setSidebarOpen: (open: boolean) => void }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages, isStreaming, selectedModel, models,
    setSelectedModel, loadChat, sendMessage, clearMessages, abortStream,
  } = useChat();

  useEffect(() => {
    if (chatId) {
      loadChat(Number(chatId));
    }
  }, [chatId, loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      sendMessage(lastUser.content, true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800
        bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <SidebarToggle onClick={() => setSidebarOpen(true)} />
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            AI Chat Assistant
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          )}
          <ModelSelector models={models} selected={selectedModel} onSelect={setSelectedModel} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                bg-gradient-to-br from-primary-500 to-emerald-500 text-white mb-6 shadow-lg">
                <Sparkles size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Ask me anything. I can help with coding, writing, analysis, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Explain quantum computing simply',
                  'Write a Python REST API',
                  'Help me debug my code',
                  'Summarize a complex topic',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="p-3 rounded-xl text-left text-sm border border-gray-200 dark:border-gray-700
                      hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300
                      transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto group">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                isLast={i === messages.length - 1}
                onRegenerate={handleRegenerate}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSend={(msg) => sendMessage(msg)}
        onStop={abortStream}
        isStreaming={isStreaming}
      />
    </div>
  );
}
