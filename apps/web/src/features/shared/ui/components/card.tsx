'use client';

import React from 'react';
import { motion } from 'motion/react';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl ${className}`}
    >
      {title && <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>}
      {children}
    </motion.div>
  );
}
