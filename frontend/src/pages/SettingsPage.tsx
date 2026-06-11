import { useState, FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Palette, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { authService } from '@/services/authService';
import { SidebarToggle } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setSidebarOpen } = useOutletContext<{ setSidebarOpen: (open: boolean) => void }>();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      await authService.updateProfile({ username, email, theme });
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (err) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    try {
      await authService.updateProfile({ theme: newTheme });
      await refreshUser();
    } catch {
      // theme still applied locally
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800
        bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl sticky top-0 z-10">
        <SidebarToggle onClick={() => setSidebarOpen(true)} />
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800
            bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <User size={20} />
            Account Settings
          </h2>

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <Input
              id="settings-username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              id="settings-email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" isLoading={isLoading}>
              <Save size={16} />
              Save Changes
            </Button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800
            bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Palette size={20} />
            Theme Preferences
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`p-4 rounded-xl border-2 transition-all text-sm font-medium capitalize
                  ${theme === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div
                  className={`w-full h-16 rounded-lg mb-3 ${
                    t === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-gray-700'
                  }`}
                />
                {t} Mode
              </button>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
