import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Trade } from '../types.ts';
import { formatCurrency, formatPercent, cn } from '../utils.ts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface DashboardProps {
  trades: Trade[];
}

const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subValue?: string;
  trend?: 'up' | 'down';
  icon: React.ElementType;
}> = ({ label, value, subValue, trend, icon: Icon }) => (
  <div className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
        <Icon size={20} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend === 'up' ? '+2.4%' : '-1.2%'}</span>
        </div>
      )}
    </div>
    <p className="text-zinc-400 text-sm font-medium mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    {subValue && <p className="text-xs text-zinc-500">{subValue}</p>}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const stats = useMemo(() => {
    const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const wins = trades.filter(t => (t.pnl || 0) > 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const totalProfit = wins.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const losses = trades.filter(t => (t.pnl || 0) < 0);
    const totalLoss = Math.abs(losses.reduce((acc, t) => acc + (t.pnl || 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    return {
      totalPnl,
      winRate,
      profitFactor,
      totalTrades: trades.length,
      avgWin: wins.length > 0 ? totalProfit / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
    };
  }, [trades]);

  const chartData = useMemo(() => {
    let cumulative = 0;
    return trades
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
      .map(t => {
        cumulative += (t.pnl || 0);
        return {
          date: format(parseISO(t.entryTime), 'MMM dd'),
          pnl: cumulative
        };
      });
  }, [trades]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    trades.forEach(t => {
      const month = format(parseISO(t.entryTime), 'MMM');
      months[month] = (months[month] || 0) + (t.pnl || 0);
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [trades]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Performance Overview</h1>
        <p className="text-zinc-400">Track your progress and analyze your trading metrics.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Net P&L" 
          value={formatCurrency(stats.totalPnl)} 
          trend={stats.totalPnl >= 0 ? 'up' : 'down'}
          icon={TrendingUp} 
        />
        <StatCard 
          label="Win Rate" 
          value={formatPercent(stats.winRate)} 
          subValue={`${trades.filter(t => (t.pnl || 0) > 0).length} wins / ${trades.length} trades`}
          icon={PieChart} 
        />
        <StatCard 
          label="Profit Factor" 
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} 
          subValue="Gross Profit / Gross Loss"
          icon={BarChart3} 
        />
        <StatCard 
          label="Avg. Win/Loss" 
          value={formatCurrency(stats.avgWin)} 
          subValue={`Loss: ${formatCurrency(stats.avgLoss)}`}
          icon={Target} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-white">Equity Curve</h3>
            <div className="flex gap-2">
              {['1W', '1M', '3M', 'ALL'].map(t => (
                <button key={t} className={cn(
                  "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
                  t === 'ALL' ? "bg-emerald-500 text-white" : "text-zinc-500 hover:bg-zinc-800"
                )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-8">Monthly P&L</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  cursor={{ fill: '#27272a' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
