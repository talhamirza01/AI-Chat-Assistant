import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { chatService } from '@/services/chatService';
import type { AIModel, Chat, Message } from '@/types';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  selectedModel: string;
  models: AIModel[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setSelectedModel: (model: string) => void;
  loadChats: () => Promise<void>;
  loadChat: (chatId: number) => Promise<void>;
  createNewChat: () => Promise<Chat>;
  deleteChat: (chatId: number) => Promise<void>;
  renameChat: (chatId: number, title: string) => Promise<void>;
  sendMessage: (content: string, regenerate?: boolean) => Promise<void>;
  clearMessages: () => void;
  loadModels: () => Promise<void>;
  abortStream: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [models, setModels] = useState<AIModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const loadChats = useCallback(async () => {
    const data = await chatService.getHistory(searchQuery || undefined);
    setChats(data.chats);
  }, [searchQuery]);

  const loadChat = useCallback(async (chatId: number) => {
    const chat = await chatService.getChat(chatId);
    setCurrentChat(chat);
    setMessages(chat.messages || []);
  }, []);

  const createNewChat = useCallback(async () => {
    const chat = await chatService.createChat();
    setCurrentChat(chat);
    setMessages([]);
    await loadChats();
    return chat;
  }, [loadChats]);

  const deleteChat = useCallback(
    async (chatId: number) => {
      await chatService.deleteChat(chatId);
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
      await loadChats();
    },
    [currentChat, loadChats]
  );

  const renameChat = useCallback(
    async (chatId: number, title: string) => {
      await chatService.renameChat(chatId, title);
      await loadChats();
      if (currentChat?.id === chatId) {
        setCurrentChat((prev) => (prev ? { ...prev, title } : null));
      }
    },
    [currentChat, loadChats]
  );

  const loadModels = useCallback(async () => {
    const modelList = await chatService.getModels();
    setModels(modelList);
    const defaultModel = modelList.find((m) => m.default);
    if (defaultModel) setSelectedModel(defaultModel.id);
  }, []);

  const abortStream = useCallback(() => {
    abortController?.abort();
    setIsStreaming(false);
  }, [abortController]);

  const sendMessage = useCallback(
    async (content: string, regenerate = false) => {
      const controller = new AbortController();
      setAbortController(controller);
      setIsStreaming(true);

      if (!regenerate) {
        setMessages((prev) => [...prev, { role: 'user', content }]);
      }

      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      try {
        await chatService.sendMessageStream(
          {
            chat_id: currentChat?.id,
            message: content,
            model: selectedModel,
            regenerate,
          },
          (event) => {
            if (event.type === 'start' && event.chat_id) {
              if (!currentChat) {
                setCurrentChat({
                  id: event.chat_id,
                  title: 'New Chat',
                  created_at: new Date().toISOString(),
                });
              }
            } else if (event.type === 'chunk' && event.content) {
              assistantContent += event.content;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: assistantContent };
                }
                return updated;
              });
            } else if (event.type === 'done' && event.chat_id) {
              setCurrentChat((prev) =>
                prev ? prev : { id: event.chat_id!, title: 'New Chat', created_at: new Date().toISOString() }
              );
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Stream error');
            }
          },
          controller.signal
        );
        await loadChats();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && !last.content) {
              updated[updated.length - 1] = {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
              };
            }
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        setAbortController(null);
      }
    },
    [currentChat, selectedModel, loadChats]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentChat(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        messages,
        isStreaming,
        selectedModel,
        models,
        searchQuery,
        setSearchQuery,
        setSelectedModel,
        loadChats,
        loadChat,
        createNewChat,
        deleteChat,
        renameChat,
        sendMessage,
        clearMessages,
        loadModels,
        abortStream,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
