import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers
} from 'lucide-react';
import { Trade } from '../types';
import { formatCurrency, cn } from '../utils';
import { format, parseISO } from 'date-fns';

interface TradeLogProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onView: (trade: Trade) => void;
  onViewFullScreen: (url: string) => void;
}

const TradeLog: React.FC<TradeLogProps> = ({ trades, onEdit, onDelete, onView, onViewFullScreen }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'long' | 'short'>('all');

  const filteredTrades = trades
    .filter(t => {
      const matchesSearch = t.symbol.toLowerCase().includes(search.toLowerCase()) || 
                           t.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || t.direction === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trade Log</h1>
          <p className="text-zinc-400">Review and manage your trading history.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search symbol or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full md:w-64"
            />
          </div>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(['all', 'long', 'short'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all",
                  filter === f ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Side</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Entry</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Exit</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lots</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Screenshot</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredTrades.map((trade) => (
                <tr 
                  key={trade.id} 
                  onClick={() => onView(trade)}
                  className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-300">{format(parseISO(trade.entryTime), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-zinc-500">{format(parseISO(trade.entryTime), 'HH:mm')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-white tracking-tight">{trade.symbol}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                      trade.direction === 'long' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{formatCurrency(trade.entryPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{trade.lots}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={cn(
                      "text-sm font-bold flex items-center gap-1",
                      (trade.pnl || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {(trade.pnl || 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatCurrency(trade.pnl || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trade.screenshots?.[0] ? (
                      <div 
                        onClick={(e) => { e.stopPropagation(); onViewFullScreen(trade.screenshots![0]); }}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 cursor-zoom-in hover:border-emerald-500/50 transition-colors group/thumb"
                      >
                        <img 
                          src={trade.screenshots[0]} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center text-zinc-700">
                        <Layers size={14} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onView(trade); }}
                        className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                        className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title="Edit Trade"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); trade.id && onDelete(trade.id); }}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Trade"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                    No trades found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-900/30">
          <p className="text-xs text-zinc-500">Showing {filteredTrades.length} of {trades.length} trades</p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-30" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-30" disabled>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeLog;
