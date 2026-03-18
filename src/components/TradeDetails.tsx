import React, { useState } from 'react';
import { X, Calendar, Clock, Target, Shield, Brain, BookOpen, ExternalLink, TrendingUp, TrendingDown, DollarSign, Layers, Edit2, Trash2, Eye } from 'lucide-react';
import { Trade } from '../types';
import { formatCurrency, cn } from '../utils';
import { format, parseISO } from 'date-fns';
import FullScreenImage from './FullScreenImage';

interface TradeDetailsProps {
  trade: Trade;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

const TradeDetails: React.FC<TradeDetailsProps> = ({ trade, onClose, onEdit, onDelete }) => {
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const isProfit = (trade.pnl || 0) >= 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* ... (Header remains same) */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-2xl shadow-lg",
              isProfit ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10" : "bg-red-500/10 text-red-500 shadow-red-500/10"
            )}>
              {trade.direction === 'long' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {trade.symbol}
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full uppercase tracking-widest border",
                  trade.direction === 'long' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {trade.direction}
                </span>
              </h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest flex items-center gap-2 mt-1">
                <Calendar size={12} />
                {format(parseISO(trade.entryTime), 'MMMM dd, yyyy')}
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <Clock size={12} />
                {format(parseISO(trade.entryTime), 'HH:mm')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* ... (Content remains same) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">P&L Result</p>
              <p className={cn(
                "text-xl font-black tracking-tight",
                isProfit ? "text-emerald-500" : "text-red-500"
              )}>
                {formatCurrency(trade.pnl || 0)}
              </p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">ROI</p>
              <p className={cn(
                "text-xl font-black tracking-tight",
                isProfit ? "text-emerald-500" : "text-red-500"
              )}>
                {trade.roi?.toFixed(2)}%
              </p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Lots</p>
              <p className="text-xl font-black text-white tracking-tight">{trade.lots}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Contract Size</p>
              <p className="text-xl font-black text-white tracking-tight">{trade.contractSize?.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Trade Details */}
            <div className="md:col-span-1 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-emerald-500" />
                  Trade Execution
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 text-sm">Entry Price</span>
                    <span className="text-white font-mono font-bold">{formatCurrency(trade.entryPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 text-sm">Exit Price</span>
                    <span className="text-white font-mono font-bold">{trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 text-sm">Stop Loss</span>
                    <span className="text-red-400 font-mono font-bold">{trade.stopLoss ? formatCurrency(trade.stopLoss) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 text-sm">Target</span>
                    <span className="text-emerald-400 font-mono font-bold">{trade.targetPrice ? formatCurrency(trade.targetPrice) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 text-sm">Fees</span>
                    <span className="text-zinc-400 font-mono font-bold">{formatCurrency(trade.fees || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} className="text-amber-500" />
                  Psychology
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">Plan Followed</span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded",
                      trade.planFollowed ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {trade.planFollowed ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">Mental State</span>
                    <span className="text-white text-sm font-bold">{trade.mentalState || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Content & Screenshot */}
            <div className="md:col-span-2 space-y-6">
              {trade.setup && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Setup / Rationale</h3>
                  <div className="bg-zinc-800/30 border border-zinc-800 p-4 rounded-2xl text-zinc-300 text-sm italic">
                    "{trade.setup}"
                  </div>
                </div>
              )}

              {trade.keyLesson && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14} className="text-blue-500" />
                    Key Lesson
                  </h3>
                  <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl text-zinc-300 text-sm">
                    {trade.keyLesson}
                  </div>
                </div>
              )}

              {trade.notes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">General Notes</h3>
                  <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {trade.notes}
                  </div>
                </div>
              )}

              {/* Screenshot Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Trade Screenshot</h3>
                  {trade.screenshots?.[0] && (
                    <button 
                      onClick={() => setFullScreenImage(trade.screenshots![0])}
                      className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-bold bg-emerald-500/5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Full Screen <Eye size={12} />
                    </button>
                  )}
                </div>
                
                {trade.screenshots?.[0] ? (
                  <div 
                    onClick={() => setFullScreenImage(trade.screenshots![0])}
                    className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video cursor-zoom-in"
                  >
                    <img 
                      src={trade.screenshots[0]} 
                      alt="Trade Analysis" 
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
                        <Eye className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600">
                    <Layers size={48} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">No screenshot provided for this trade</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { onClose(); onEdit(trade); }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Edit2 size={18} />
              Edit Trade
            </button>
            <button 
              onClick={() => { if (trade.id) { onClose(); onDelete(trade.id); } }}
              className="px-6 py-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 font-bold rounded-2xl transition-all flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {fullScreenImage && (
        <FullScreenImage 
          src={fullScreenImage} 
          alt={`${trade.symbol} Trade Screenshot`} 
          onClose={() => setFullScreenImage(null)} 
        />
      )}
    </div>
  );
};

export default TradeDetails;
