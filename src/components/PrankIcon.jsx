import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';

export default function PrankIcon({ 
  icon: Icon, 
  messages = [], 
  className
}) {
  const [clicks, setClicks] = useState(0);
  const [showMsg, setShowMsg] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 'auto', right: 'auto', isRightSide: true });
  
  const timerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isRight = rect.left > window.innerWidth / 2;
      
      setCoords({
        // Берем НИЖНЮЮ границу кнопки, чтобы тултип был под ней
        top: rect.bottom, 
        left: isRight ? 'auto' : rect.left,
        right: isRight ? window.innerWidth - rect.right : 'auto',
        isRightSide: isRight
      });
    }

    setClicks(prev => prev + 1);
    setShowMsg(true);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowMsg(false);
      setClicks(prev => (prev >= messages.length ? 0 : prev)); 
    }, 2000);
  };

  const isAngry = clicks >= messages.length && clicks > 0;
  const currentMsg = messages[Math.min(clicks - 1, messages.length - 1)] || "";

  return (
    <>
      <motion.div 
        ref={buttonRef}
        whileTap={{ scale: 0.8 }}
        onClick={handleClick}
        className={cn(
          "bg-zinc-800/50 p-3 rounded-xl border border-white/5 cursor-pointer transition-colors hover:bg-zinc-700/50 select-none",
          isAngry && "animate-bounce bg-rose-500/20 border-rose-500/50",
          className
        )}
      >
        <Icon 
          className={cn(
            "transition-colors duration-300", 
            isAngry ? "text-rose-500" : "text-zinc-400"
          )} 
          size={20} 
          strokeWidth={1.5} 
        />
      </motion.div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showMsg && clicks > 0 && (
            <motion.div
              key="prank-tooltip"
              initial={{ opacity: 0, y: -5, scale: 0.8 }}
              // Анимируем движение ВНИЗ (в плюс)
              animate={{ opacity: 1, y: 12, scale: 1 }} 
              exit={{ opacity: 0, y: 0, scale: 0.8 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                right: coords.right,
                zIndex: 999999,
                // Точка роста анимации теперь СВЕРХУ (top)
                transformOrigin: coords.isRightSide ? 'top right' : 'top left',
                // Фикс мыла шрифтов на iOS:
                WebkitFontSmoothing: 'antialiased',
                transformStyle: 'preserve-3d'
              }}
              className="whitespace-nowrap bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none"
            >
              {currentMsg}
              {/* Хвостик теперь СВЕРХУ (-top-1) */}
              <div className={cn(
                "absolute -top-1 w-2 h-2 bg-indigo-500 rotate-45",
                coords.isRightSide ? "right-[18px]" : "left-[18px]"
              )}></div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}