import React from 'react';
import { DifficultyLevel } from '../types';

const STYLES: Record<DifficultyLevel, string> = {
  Beginner:     'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40',
  Intermediate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
  Advanced:     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40',
};

const ICONS: Record<DifficultyLevel, string> = {
  Beginner: '🌱',
  Intermediate: '⚡',
  Advanced: '🔥',
};

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  className?: string;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ level, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${STYLES[level]} ${className}`}>
    {ICONS[level]} {level}
  </span>
);

export default DifficultyBadge;
