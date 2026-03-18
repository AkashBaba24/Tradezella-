import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  X,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  isToday
} from 'date-fns';
import { Trade } from '../types';
import { formatCurrency, cn } from '../utils';

interface CalendarViewProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onView: (trade: Trade) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ trades, onEdit, onDelete, onView }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dailyStats = useMemo(() => {
    const stats: Record<string, { pnl: number; count: number }> = {};
    trades.forEach(trade => {
      const dateKey = format(parseISO(trade.entryTime), 'yyyy-MM-dd');
      if (!stats[dateKey]) {
        stats[dateKey] = { pnl: 0, count: 0 };
      }
      stats[dateKey].pnl += (trade.pnl || 0);
      stats[dateKey].count += 1;
    });
    return stats;
  }, [trades]);

  const selectedDateTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => isSameDay(parseISO(t.entryTime), selectedDate))
                 .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  }, [selectedDate, trades]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading Calendar</h1>
          <p className="text-zinc-400">View your daily performance at a glance.</p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-white min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* ... (Calendar days remain same) */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-zinc-900/80 py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const stats = dailyStats[dateKey];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "min-h-[100px] md:min-h-[120px] p-2 transition-all cursor-pointer relative group",
                isCurrentMonth ? "bg-zinc-900/40" : "bg-zinc-950/40 opacity-30",
                isSelected ? "ring-2 ring-emerald-500/50 bg-emerald-500/5 z-10" : "hover:bg-zinc-800/40"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                  isTodayDate ? "bg-emerald-500 text-white" : "text-zinc-500"
                )}>
                  {format(day, 'd')}
                </span>
                {stats && (
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
                    {stats.count} {stats.count === 1 ? 'Trade' : 'Trades'}
                  </span>
                )}
              </div>

              {stats && (
                <div className={cn(
                  "mt-2 text-sm font-bold flex items-center gap-0.5",
                  stats.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                )}>
                  {stats.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {formatCurrency(Math.abs(stats.pnl))}
                </div>
              )}
              
              {isSelected && (
                <div className="absolute bottom-1 right-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Trades Modal/Section */}
      {selectedDate && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Search size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Trades on {format(selectedDate, 'MMMM dd, yyyy')}</h3>
                <p className="text-xs text-zinc-500">
                  Total P&L: <span className={cn(
                    "font-bold",
                    (dailyStats[format(selectedDate, 'yyyy-MM-dd')]?.pnl || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    {formatCurrency(dailyStats[format(selectedDate, 'yyyy-MM-dd')]?.pnl || 0)}
                  </span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedDate(null)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Side</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Exit</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lots</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {selectedDateTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    onClick={() => onView(trade)}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {format(parseISO(trade.entryTime), 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                      {trade.symbol}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onView(trade); }}
                          className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                          className="p-1.5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Edit Trade"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); trade.id && onDelete(trade.id); }}
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Trade"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {selectedDateTrades.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No trades found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
