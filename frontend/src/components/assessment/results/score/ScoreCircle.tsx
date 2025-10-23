import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ScoreCircleProps } from '../types/results.types';

/**
 * ScoreCircle
 * Large animated circular score display with count-up animation
 */
export const ScoreCircle: React.FC<ScoreCircleProps> = ({ score, color, size = 'lg' }) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score count-up
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = score / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(Math.round(score));
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [score]);

  const sizeClasses = {
    sm: 'w-24 h-24 text-2xl',
    md: 'w-32 h-32 text-3xl',
    lg: 'w-48 h-48 text-5xl',
  };

  const colorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
  };

  const borderColors = {
    red: '#dc2626',
    orange: '#ea580c',
    yellow: '#ca8a04',
    green: '#16a34a',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-full border-4 font-bold',
        sizeClasses[size],
        colorClasses[color]
      )}
      style={{
        borderColor: borderColors[color],
      }}
    >
      <span className={colorClasses[color]}>{displayScore}</span>
      <span className="text-sm font-normal text-gray-400">/100</span>
    </motion.div>
  );
};
