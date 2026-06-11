import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useChat } from '@/contexts/ChatContext';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadChats, loadModels } = useChat();

  useEffect(() => {
    loadChats();
    loadModels();
  }, [loadChats, loadModels]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet context={{ setSidebarOpen }} />
      </main>
    </div>
  );
}
