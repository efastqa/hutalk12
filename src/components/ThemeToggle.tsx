import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'icon' | 'compact' | 'segmented' | 'pill';
  showLabel?: boolean;
  className?: string;
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  showLabel = false,
  className = '',
  id,
}) => {
  const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();

  // 1. Segmented 3-Way Selector (Light / Dark / System)
  if (variant === 'segmented') {
    const options: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
      { id: 'light', label: 'Light', icon: Sun },
      { id: 'dark', label: 'Dark', icon: Moon },
      { id: 'system', label: 'Auto', icon: Monitor },
    ];

    return (
      <div
        id={id || 'theme-toggle-segmented'}
        role="group"
        aria-label="Theme mode selection"
        className={`inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-semibold select-none ${className}`}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-[#2A2E3D] text-[#FF5A36] dark:text-[#FF7A59] font-bold shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF5A36] dark:text-[#FF7A59]' : 'text-current'}`} />
              <span>{opt.label}</span>
              {isSelected && (
                <motion.div
                  layoutId="activeThemePill"
                  className="absolute inset-0 rounded-lg ring-1 ring-[#FF5A36]/30 dark:ring-[#FF5A36]/40 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Compact Pill with Icon and Label
  if (variant === 'pill') {
    return (
      <button
        id={id || 'theme-toggle-pill'}
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-bold ${
          isDark
            ? 'bg-[#181920] border-[#2D2F39] text-amber-300 hover:bg-[#22242F]'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        } ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5"
            >
              <Moon className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Dark Mode</span>
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Light Mode</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // 3. Compact text + icon button for headers / navbars
  if (variant === 'compact') {
    return (
      <button
        id={id || 'theme-toggle-compact'}
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer text-gray-300 hover:text-white ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 text-amber-300"
            >
              <Moon className="w-3.5 h-3.5 fill-amber-300" />
              <span className="hidden xs:inline">Dark</span>
            </motion.div>
          ) : (
            <motion.div
              key="light"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 text-amber-400"
            >
              <Sun className="w-3.5 h-3.5 fill-amber-400" />
              <span className="hidden xs:inline">Light</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // 4. Default: Standard Icon Button (Round or Rounded-XL)
  return (
    <motion.button
      id={id || 'theme-toggle-icon'}
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`relative p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
        isDark
          ? 'bg-white/10 hover:bg-white/15 text-amber-300 border border-white/10 shadow-xs'
          : 'bg-white/10 hover:bg-white/15 text-amber-400 border border-white/10 shadow-xs'
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5"
          >
            <Moon className="w-4 h-4 fill-amber-300 text-amber-300" />
            {showLabel && <span className="text-xs font-bold text-gray-200">Dark</span>}
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5"
          >
            <Sun className="w-4 h-4 fill-amber-400 text-amber-400" />
            {showLabel && <span className="text-xs font-bold text-gray-200">Light</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
