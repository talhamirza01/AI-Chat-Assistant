import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MessageSquare, Trash2, Pencil, X,
  LayoutDashboard, Settings, LogOut, Moon, Sun, Menu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarSkeleton } from '@/components/ui/LoadingSkeleton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    chats, currentChat, searchQuery, setSearchQuery,
    loadChats, loadChat, createNewChat, deleteChat, renameChat,
  } = useChat();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNewChat = async () => {
    await createNewChat();
    navigate('/chat');
    onClose();
  };

  const handleSelectChat = async (chatId: number) => {
    await loadChat(chatId);
    navigate(`/chat/${chatId}`);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteChat(chatId);
    }
  };

  const handleRename = async (chatId: number) => {
    if (editTitle.trim()) {
      await renameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    setIsLoading(true);
    await loadChats();
    setIsLoading(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm
              bg-gray-100 dark:bg-gray-800 border border-transparent
              focus:border-primary-500 focus:outline-none
              text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <SidebarSkeleton />
        ) : chats.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No conversations yet</p>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors
                  ${currentChat?.id === chat.id
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <MessageSquare size={16} className="flex-shrink-0 opacity-50" />
                {editingId === chat.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(chat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-b border-primary-500 outline-none text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 truncate">{chat.title}</span>
                )}
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(chat.id);
                      setEditTitle(chat.title);
                    }}
                    className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                    aria-label="Rename chat"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    aria-label="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
        <button
          onClick={() => { navigate('/dashboard'); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
            hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        <button
          onClick={() => { navigate('/settings'); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
            hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
            hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={async () => { await logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
            hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
        {user && (
          <div className="px-3 py-2 text-xs text-gray-400 truncate">
            {user.email}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-gray-200 dark:border-gray-800
        bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-72 z-50 flex flex-col
              border-r border-gray-200 dark:border-gray-800
              bg-white dark:bg-gray-950 lg:hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
}
