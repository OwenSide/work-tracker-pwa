import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Pencil, Check, Trash2, Clock } from 'lucide-react';
import { cn } from '../utils/utils';

export default function NormCounter({ total, onChangeTotal, history, onChangeHistory }) {
  const [inputValue, setInputValue] = useState('');
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [editTotalInput, setEditTotalInput] = useState('');

  const handleAdd = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val !== 0) {
      const newItem = {
        id: Date.now(),
        amount: val,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onChangeTotal(total + val);
      onChangeHistory([newItem, ...history]);
      setInputValue('');
    }
  };

  const handleRemoveHistoryItem = (id, amount) => {
    onChangeTotal(Math.max(0, total - amount));
    onChangeHistory(history.filter(item => item.id !== id));
  };

  const handleSaveEditedTotal = () => {
    const val = parseInt(editTotalInput, 10);
    onChangeTotal(!isNaN(val) ? val : 0);
    setIsEditingTotal(false);
  };

  return (
    <div className="w-full flex flex-col gap-3 relative z-20">
      
      {/* ПРЕМИУМ-ПАНЕЛЬ */}
      <div className="flex items-center justify-between w-full bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
        
        {/* ЛЕВАЯ ЧАСТЬ: ВВОД ДАННЫХ С ИКОНКОЙ КОРОБКИ */}
        <div className="flex items-center flex-1 bg-black/40 rounded-full h-14 relative overflow-hidden border border-white/5 transition-colors focus-within:border-indigo-500/40 focus-within:bg-black/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none text-indigo-400/60">
            <Package size={18} />
          </div>
          <input
            type="number"
            placeholder="+ 0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            className="w-full h-full bg-transparent text-white pl-11 pr-14 text-xl font-bold tracking-wider placeholder:text-zinc-700 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={handleAdd}
            disabled={!inputValue}
            className="absolute right-1.5 top-1.5 bottom-1.5 w-11 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:from-zinc-900 disabled:to-zinc-900 disabled:text-zinc-700 text-white rounded-full flex items-center justify-center transition-all shadow-[0_2px_10px_rgba(99,102,241,0.3)] disabled:shadow-none"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>

        {/* СТЕКЛЯННЫЙ РАЗДЕЛИТЕЛЬ */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-3 shrink-0"></div>

        {/* ПРАВАЯ ЧАСТЬ: ИТОГОВЫЙ СЧЕТЧИК С КАРАНДАШОМ */}
        <div className="flex items-center justify-end pr-1.5 shrink-0 min-w-[90px]">
          {!isEditingTotal ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-md">
                {total}
              </span>
              <button 
                onClick={() => { setEditTotalInput(total); setIsEditingTotal(true); }} 
                className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white hover:scale-105 transition-all shadow-sm"
              >
                <Pencil size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full justify-end py-1">
              <input
                type="number"
                value={editTotalInput}
                onChange={(e) => setEditTotalInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditedTotal(); }}
                className="w-14 h-12 bg-black/60 border border-indigo-500/50 rounded-2xl px-1 text-white text-center text-lg font-black focus:outline-none shadow-inner appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button 
                onClick={handleSaveEditedTotal} 
                className="w-12 h-12 flex items-center justify-center text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl transition-all"
              >
                <Check size={18} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ИСТОРИЯ ВВОДОВ */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="relative"
          >
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-1.5 shadow-inner overflow-hidden">
              <div className="max-h-[140px] overflow-y-auto no-scrollbar flex flex-col gap-0.5">
                {history.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index, 5) * 0.05 }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Plus size={14} strokeWidth={3} />
                      </div>
                      <span className="text-base font-bold text-white tabular-nums tracking-tight">
                        {item.amount}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 font-mono tracking-wider">{item.time}</span>
                      <button 
                        onClick={() => handleRemoveHistoryItem(item.id, item.amount)}
                        className="text-zinc-600 hover:text-rose-400 p-1.5 bg-transparent hover:bg-rose-500/10 rounded-full transition-all"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}