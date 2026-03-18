import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Tag as TagIcon, Image as ImageIcon } from 'lucide-react';
import { Trade, TradeDirection } from '../types';
import { cn } from '../utils';

interface TradeFormProps {
  trade?: Trade | null;
  onSave: (trade: Partial<Trade>) => void;
  onClose: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ trade, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    symbol: '',
    direction: 'long',
    entryPrice: 0,
    exitPrice: 0,
    stopLoss: 0,
    targetPrice: 0,
    lots: 0,
    contractSize: 100000,
    fees: 0,
    setup: '',
    planFollowed: true,
    mentalState: 'Calm',
    keyLesson: '',
    notes: '',
    tags: [],
    screenshots: [],
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: '',
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        ...trade,
        symbol: trade.symbol || '',
        direction: trade.direction || 'long',
        entryPrice: trade.entryPrice || 0,
        exitPrice: trade.exitPrice || 0,
        stopLoss: trade.stopLoss || 0,
        targetPrice: trade.targetPrice || 0,
        lots: trade.lots || 0,
        contractSize: trade.contractSize || 100000,
        fees: trade.fees || 0,
        setup: trade.setup || '',
        planFollowed: trade.planFollowed ?? true,
        mentalState: trade.mentalState || 'Calm',
        keyLesson: trade.keyLesson || '',
        notes: trade.notes || '',
        tags: trade.tags || [],
        screenshots: trade.screenshots || [],
        entryTime: trade.entryTime ? trade.entryTime.slice(0, 16) : new Date().toISOString().slice(0, 16),
        exitTime: trade.exitTime ? trade.exitTime.slice(0, 16) : '',
      });
    }
  }, [trade]);

  // Auto-set contract size based on symbol
  useEffect(() => {
    if (!trade && formData.symbol) {
      const symbol = formData.symbol.toUpperCase();
      let size = 100000; // Default for Forex
      
      if (symbol.includes('XAU') || symbol.includes('GOLD')) size = 100;
      else if (symbol.includes('XAG') || symbol.includes('SILVER')) size = 5000;
      else if (symbol.includes('BTC') || symbol.includes('ETH')) size = 1;
      else if (symbol.includes('US30') || symbol.includes('NAS100') || symbol.includes('GER40')) size = 1;
      
      setFormData(prev => ({ ...prev, contractSize: size }));
    }
  }, [formData.symbol, trade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate P&L using Exness Formula:
    // Profit = (Closing Price - Opening Price) * Lots * Contract Size
    const entry = Number(formData.entryPrice);
    const exit = Number(formData.exitPrice);
    const lots = Number(formData.lots);
    const contractSize = Number(formData.contractSize || 100000);
    const fees = Number(formData.fees || 0);
    
    let pnl = 0;
    if (exit > 0) {
      if (formData.direction === 'long') {
        pnl = (exit - entry) * lots * contractSize - fees;
      } else {
        pnl = (entry - exit) * lots * contractSize - fees;
      }
    }

    onSave({
      ...formData,
      screenshots: (formData.screenshots || []).filter(url => url.trim() !== ''),
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: Number(formData.stopLoss),
      targetPrice: Number(formData.targetPrice),
      lots: lots,
      contractSize: contractSize,
      fees: fees,
      pnl: pnl,
      roi: (entry > 0 && lots > 0) ? (pnl / (entry * lots * (contractSize / 100))) * 100 : 0, // Simplified ROI for margin
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">{trade ? 'Edit Trade' : 'New Trade Entry'}</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Entry Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Entry Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Symbol</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. BTCUSDT"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Direction</label>
                <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                  {(['long', 'short'] as TradeDirection[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, direction: d })}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-all",
                        formData.direction === d 
                          ? d === 'long' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Entry Time</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.entryTime}
                  onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Entry Price</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData({ ...formData, entryPrice: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Stop Loss (SL)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.stopLoss}
                  onChange={(e) => setFormData({ ...formData, stopLoss: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target</label>
                <input
                  type="number"
                  step="any"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Lots</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.01"
                  value={formData.lots}
                  onChange={(e) => setFormData({ ...formData, lots: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Contract Size</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={formData.contractSize}
                  onChange={(e) => setFormData({ ...formData, contractSize: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Setup / Reason</label>
              <input
                type="text"
                placeholder="e.g. Breakout, Support Bounce, EMA Cross"
                value={formData.setup}
                onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </section>

          {/* Section 2: Execution */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Execution & Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  value={formData.exitPrice}
                  onChange={(e) => setFormData({ ...formData, exitPrice: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Fees</label>
                <input
                  type="number"
                  step="any"
                  value={formData.fees}
                  onChange={(e) => setFormData({ ...formData, fees: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Exit Time</label>
                <input
                  type="datetime-local"
                  value={formData.exitTime}
                  onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Screenshot URLs (Max 5)</label>
                {(formData.screenshots?.length || 0) < 5 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, screenshots: [...(formData.screenshots || []), ''] })}
                    className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1"
                  >
                    + Add Screenshot
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {formData.screenshots?.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://tradingview.com/x/..."
                      value={url}
                      onChange={(e) => {
                        const newScreenshots = [...(formData.screenshots || [])];
                        newScreenshots[index] = e.target.value;
                        setFormData({ ...formData, screenshots: newScreenshots });
                      }}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newScreenshots = (formData.screenshots || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, screenshots: newScreenshots });
                      }}
                      className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
                {(formData.screenshots?.length || 0) === 0 && (
                  <div 
                    onClick={() => setFormData({ ...formData, screenshots: [''] })}
                    className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-zinc-600 hover:border-zinc-700 hover:text-zinc-500 cursor-pointer transition-all"
                  >
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No screenshots added (Optional)</p>
                    <p className="text-[10px] mt-1">Click to add up to 5 chart links</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Review */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              Post-Trade Review
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Plan Followed?</label>
                <select
                  value={formData.planFollowed ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, planFollowed: e.target.value === 'yes' })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="yes">Yes, stuck to the plan</option>
                  <option value="no">No, acted on emotion</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Mental State</label>
                <select
                  value={formData.mentalState}
                  onChange={(e) => setFormData({ ...formData, mentalState: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="Calm">Calm & Focused</option>
                  <option value="Fear">Fear of Loss</option>
                  <option value="Greed">Greed / FOMO</option>
                  <option value="Anxious">Anxious / Stressed</option>
                  <option value="Confident">Confident</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Key Lesson</label>
              <textarea
                rows={2}
                placeholder="What did this trade teach you?"
                value={formData.keyLesson}
                onChange={(e) => setFormData({ ...formData, keyLesson: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">General Notes</label>
              <textarea
                rows={3}
                placeholder="Any other details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </section>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
            >
              <Save size={20} />
              <span>{trade ? 'Update Trade' : 'Save Trade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
