import React from 'react';

export default function Settings({ hourlyRate, setHourlyRate, currency }) {
  return (
    <div className="p-6 h-full animate-fade-in overflow-y-auto pb-32 no-scrollbar">
      <h2 className="text-3xl font-bold mb-8 text-white tracking-tight">Настройки</h2>
      
      <div className="space-y-6">
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

          <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Почасовая ставка
          </label>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <span className="text-xl text-emerald-400 font-bold">{currency}</span>
            </div>
            <input
              type="number"
              step="any"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black/30 text-white border border-white/10 rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-2xl font-semibold transition-all"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
              <span className="text-sm text-gray-500 font-medium">/ час</span>
            </div>
          </div>

          <div className="mt-6 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 items-start">
            <div className="mt-0.5 text-indigo-400">💡</div>
            <p className="text-indigo-200/70 text-sm leading-relaxed">
              Изменение ставки повлияет только на новые смены.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}