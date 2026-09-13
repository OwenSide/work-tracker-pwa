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
  // Добавим "умные" координаты для позиционирования
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
      // Проверяем, в какой половине экрана находится кнопка
      const isRight = rect.left > window.innerWidth / 2;
      
      setCoords({
        top: rect.top, 
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
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -45, scale: 1 }} // Убрали x: '-50%'
              exit={{ opacity: 0, y: -35, scale: 0.8 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                right: coords.right, // Тултип цепляется за правильный край
                zIndex: 999999,
                transformOrigin: coords.isRightSide ? 'bottom right' : 'bottom left' // Анимация растет из кнопки
              }}
              className="whitespace-nowrap bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none"
            >
              {currentMsg}
              {/* Хвостик динамически смещается в зависимости от того, где иконка */}
              <div className={cn(
                "absolute -bottom-1 w-2 h-2 bg-indigo-500 rotate-45",
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