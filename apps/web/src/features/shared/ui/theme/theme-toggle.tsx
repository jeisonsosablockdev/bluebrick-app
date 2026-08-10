'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm font-medium transition-colors"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
    </motion.button>
  );
}
