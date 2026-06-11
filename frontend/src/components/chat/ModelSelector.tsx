import { ChevronDown, Cpu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIModel } from '@/types';

interface ModelSelectorProps {
  models: AIModel[];
  selected: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({ models, selected, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((m) => m.id === selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-300 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Cpu size={14} />
        <span className="hidden sm:inline">{selectedModel?.name || 'Select Model'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full mt-1 right-0 w-56 rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden"
            role="listbox"
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${model.id === selected
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                role="option"
                aria-selected={model.id === selected}
              >
                {model.name}
                {model.default && (
                  <span className="ml-2 text-xs text-gray-400">(default)</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
