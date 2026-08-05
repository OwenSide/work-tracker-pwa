import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZE = 380;
const CENTER = SIZE / 2;
const RADIUS = 166;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// 12 часов в миллисекундах для полного оборота циферблата
const SHIFT_MAX_MS = 12 * 60 * 60 * 1000;

export default function ProgressCircle({ elapsed, shiftData, isRunning, isPaused }) {
  
  // Прогресс теперь привязан к 12-часовому циферблату
  const currentProgress = (elapsed % SHIFT_MAX_MS) / SHIFT_MAX_MS;
  const strokeDashoffset = isRunning || isPaused ? CIRCUMFERENCE - (currentProgress * CIRCUMFERENCE) : CIRCUMFERENCE;

  const angle = (currentProgress * 360) - 90;

  const particles = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      xOffset: (Math.random() - 0.5) * 20, 
      yOffset: -(Math.random() * 50 + 15),
      delay: Math.random() * 0.8,
      duration: Math.random() * 0.5 + 0.4,
      size: Math.random() * 1.5 + 0.5
    }));
  }, []);

  const getVisuals = () => {
    if (shiftData.isHoliday) return { grad: "url(#grad-holiday)", glow: "#f59e0b" };
    if (shiftData.isWeekend) return { grad: "url(#grad-weekend)", glow: "#06b6d4" };
    
    if (!shiftData.isWeekend && !shiftData.isHoliday) {
      if (shiftData.isOvertime) return { grad: "url(#grad-overdrive)", glow: "#10b981" };
      if (elapsed >= 10 * 3600 * 1000) return { grad: "url(#grad-danger)", glow: "#ef4444" };
      if (elapsed >= 8 * 3600 * 1000) return { grad: "url(#grad-warning)", glow: "#f59e0b" };
    }
    
    return { grad: "url(#grad-standard)", glow: "#818cf8" };
  };

  const { grad: strokeGradient, glow: sparkGlow } = getVisuals();

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="grad-standard" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient>
          <linearGradient id="grad-warning" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f97316" /></linearGradient>
          <linearGradient id="grad-danger" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
          <linearGradient id="grad-overdrive" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient>
          <linearGradient id="grad-weekend" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient>
          <linearGradient id="grad-holiday" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
          
          <linearGradient id="neon-tail" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={sparkGlow} stopOpacity="0.8" />
            <stop offset="100%" stopColor={sparkGlow} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="neon-tail-core" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor={sparkGlow} stopOpacity="0.4" />
            <stop offset="100%" stopColor={sparkGlow} stopOpacity="0" />
          </linearGradient>

          <filter id="svg-blur-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="svg-blur-md" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      </svg>

      <svg 
        width={SIZE} height={SIZE} 
        viewBox={`0 0 ${SIZE} ${SIZE}`} 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible z-20"
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="4 6" fill="none" />
        
        <motion.circle 
          cx={CENTER} cy={CENTER} r={RADIUS} 
          stroke={sparkGlow} 
          strokeWidth="14" 
          fill="none" 
          strokeDasharray={CIRCUMFERENCE} 
          animate={{ strokeDashoffset }} 
          transition={{ duration: 0.5, ease: "easeInOut" }} 
          strokeLinecap="round" 
          filter="url(#svg-blur-lg)"
          opacity="0.5"
          className="origin-center -rotate-90" 
        />
        
        <motion.circle 
          cx={CENTER} cy={CENTER} r={RADIUS} 
          stroke={sparkGlow} 
          strokeWidth="6" 
          fill="none" 
          strokeDasharray={CIRCUMFERENCE} 
          animate={{ strokeDashoffset }} 
          transition={{ duration: 0.5, ease: "easeInOut" }} 
          strokeLinecap="round" 
          filter="url(#svg-blur-md)"
          opacity="0.8"
          className="origin-center -rotate-90" 
        />

        <motion.circle 
          cx={CENTER} cy={CENTER} r={RADIUS} 
          stroke={strokeGradient} 
          strokeWidth="2.5" 
          fill="none" 
          strokeDasharray={CIRCUMFERENCE} 
          animate={{ strokeDashoffset }} 
          transition={{ duration: 0.5, ease: "easeInOut" }} 
          strokeLinecap="round" 
          className="origin-center -rotate-90" 
        />

        <AnimatePresence>
          {(isRunning || isPaused) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: angle }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 0.5, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
            >
              <circle cx={CENTER} cy={CENTER} r={RADIUS + 50} fill="none" stroke="none" />

              {particles.map(p => (
                <motion.circle
                  key={p.id}
                  cx={CENTER + RADIUS}
                  cy={CENTER}
                  r={p.size}
                  fill="#ffffff"
                  animate={{
                    cx: [CENTER + RADIUS, CENTER + RADIUS + p.xOffset],
                    cy: [CENTER, CENTER + p.yOffset],
                    opacity: [0, 0.9, 0],
                    scale: [0, 1.2, 0.5]
                  }}
                  transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
                />
              ))}

              <path d={`M ${CENTER + RADIUS - 4} ${CENTER + 2} L ${CENTER + RADIUS + 4} ${CENTER + 2} L ${CENTER + RADIUS} ${CENTER - 45} Z`} fill="url(#neon-tail)" filter="url(#svg-blur-md)" />
              <path d={`M ${CENTER + RADIUS - 1.5} ${CENTER + 1} L ${CENTER + RADIUS + 1.5} ${CENTER + 1} L ${CENTER + RADIUS} ${CENTER - 25} Z`} fill="url(#neon-tail-core)" />

              <circle cx={CENTER + RADIUS} cy={CENTER} r="16" fill={sparkGlow} opacity="0.3" filter="url(#svg-blur-lg)" />
              <circle cx={CENTER + RADIUS} cy={CENTER} r="7" fill={sparkGlow} opacity="0.7" filter="url(#svg-blur-md)" />

              <g transform={`translate(${CENTER + RADIUS}, ${CENTER})`}>
                <path 
                  d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" 
                  fill="#ffffff" 
                  opacity="0.95"
                />
                <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
              </g>

            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </>
  );
}