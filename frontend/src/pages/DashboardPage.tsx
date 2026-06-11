import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Hash, Zap, BarChart3, Clock, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { SidebarToggle } from '@/components/layout/Sidebar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import type { UserStats } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { chats } = useChat();
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext<{ setSidebarOpen: (open: boolean) => void }>();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserStats>('/user/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Chats', value: stats?.total_chats ?? 0, icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Messages', value: stats?.total_messages ?? 0, icon: Hash, color: 'text-emerald-500' },
    { label: 'Tokens Used', value: stats?.total_tokens ?? 0, icon: Zap, color: 'text-amber-500' },
    { label: 'API Requests', value: stats?.total_requests ?? 0, icon: BarChart3, color: 'text-purple-500' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800
        bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl sticky top-0 z-10">
        <SidebarToggle onClick={() => setSidebarOpen(true)} />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.username}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s an overview of your AI assistant activity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800
                bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
            >
              {loading ? (
                <LoadingSkeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <card.icon size={20} className={card.color} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800
              bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={18} />
                Recent Chats
              </h3>
              <button
                onClick={() => navigate('/chat')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>
            {chats.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No conversations yet. Start chatting!</p>
            ) : (
              <div className="space-y-2">
                {chats.slice(0, 5).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm
                      hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <span className="truncate text-gray-700 dark:text-gray-300">{chat.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {chat.message_count} msgs
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800
              bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Profile</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Username</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{user?.username}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd className="text-gray-900 dark:text-white font-medium capitalize">{user?.role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Member since</dt>
                <dd className="text-gray-900 dark:text-white font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
