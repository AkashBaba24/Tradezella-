import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Package, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { cn, formatCurrency } from '../utils';
import { format, parseISO } from 'date-fns';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  product: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" />
            Admin Dashboard
          </h1>
          <p className="text-zinc-400">Manage and approve premium membership requests.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-500">
              <Package size={32} />
            </div>
            <p className="text-zinc-400">No orders found.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-zinc-900/80"
            >
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <Mail size={14} />
                      <span>{order.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Product</p>
                    <p className="text-sm text-zinc-300">{order.product}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount</p>
                    <p className="text-sm text-emerald-500 font-bold">{formatCurrency(order.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</p>
                    <p className="text-sm text-zinc-300">{format(parseISO(order.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</p>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      order.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                      order.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      {order.status === 'pending' ? <Clock size={12} /> :
                       order.status === 'approved' ? <CheckCircle2 size={12} /> :
                       <XCircle size={12} />}
                      {order.status}
                    </div>
                  </div>
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="flex items-center gap-3">
                  <button
                    disabled={actionLoading === order.id}
                    onClick={() => handleStatusUpdate(order.id, 'rejected')}
                    className="flex-1 md:flex-none px-4 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={actionLoading === order.id}
                    onClick={() => handleStatusUpdate(order.id, 'approved')}
                    className="flex-1 md:flex-none px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
