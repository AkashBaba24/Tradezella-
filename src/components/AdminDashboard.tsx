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
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../utils.ts';
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

interface Product {
  id?: string;
  name: string;
  price: number;
  duration?: string;
  description?: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Product form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Product>({ name: '', price: 0, duration: '30 Days', description: '' });

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setOrders(data);
        setError(null);
      } else {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 500));
        setError(`API Error: ${response.status}. Check console for full response.`);
      }
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      if (!error) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchProducts()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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

  const handleQuickPriceUpdate = async (product: Product, delta: number) => {
    if (!product.id) return;
    
    const newPrice = Math.max(0, product.price + delta);
    setActionLoading(`price-${product.id}`);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, price: newPrice }),
      });

      if (!response.ok) throw new Error('Failed to update price');
      
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: newPrice } : p));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('product-save');
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      if (!response.ok) throw new Error('Failed to save product');
      
      await fetchProducts();
      setIsAddingProduct(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, duration: '30 Days', description: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setActionLoading(null);
    }
  };

  const generateStandardPlans = async () => {
    if (!confirm('This will add standard subscription plans (1 Week, 15 Days, 30 Days, 6 Months, 1 Year). Continue?')) return;
    
    const standardPlans = [
      { name: '1 Week Subscription', price: 5, duration: '7 Days', description: 'Access for 7 days' },
      { name: '15 Days Subscription', price: 10, duration: '15 Days', description: 'Access for 15 days' },
      { name: '30 Days Subscription', price: 18, duration: '30 Days', description: 'Access for 30 days' },
      { name: '6 Months Subscription', price: 80, duration: '180 Days', description: 'Access for 6 months' },
      { name: '1 Year Subscription', price: 150, duration: '365 Days', description: 'Access for 1 year' },
    ];

    setActionLoading('generating-plans');
    try {
      for (const plan of standardPlans) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan),
        });
      }
      await fetchProducts();
    } catch (err) {
      alert('Error generating plans: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    setActionLoading(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsAddingProduct(true);
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
          <p className="text-zinc-400">Manage membership requests and subscription pricing.</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "pb-4 px-2 font-bold transition-all relative",
            activeTab === 'orders' ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Orders
          {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "pb-4 px-2 font-bold transition-all relative",
            activeTab === 'products' ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Subscription Plans
          {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {activeTab === 'orders' ? (
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
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Plan</p>
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
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Manage Subscription Plans</h2>
            <div className="flex gap-3">
              <button
                disabled={actionLoading === 'generating-plans'}
                onClick={generateStandardPlans}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {actionLoading === 'generating-plans' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock size={18} />}
                Auto-generate Plans
              </button>
              {!isAddingProduct && (
                <button
                  onClick={() => {
                    setIsAddingProduct(true);
                    setEditingProduct(null);
                    setProductForm({ name: '', price: 0, duration: '30 Days', description: '' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
                >
                  <Plus size={18} />
                  Add Plan
                </button>
              )}
            </div>
          </div>

          {isAddingProduct && (
            <form onSubmit={handleSaveProduct} className="bg-zinc-900/80 border border-emerald-500/30 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in duration-300">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingProduct ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingProduct ? 'Edit Plan' : 'New Subscription Plan'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 1 Month Premium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Duration</label>
                  <input
                    type="text"
                    required
                    value={productForm.duration}
                    onChange={e => setProductForm({ ...productForm, duration: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 30 Days"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="9.99"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24"
                  placeholder="Describe the plan features..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'product-save'}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {actionLoading === 'product-save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                  Save Plan
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-12 text-center space-y-4">
                <p className="text-zinc-400 italic">No subscription plans defined yet. Add your first plan or use "Auto-generate".</p>
              </div>
            ) : (
              products.map(product => (
                <div key={product.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4 group hover:bg-zinc-900/80 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                      <Tag size={20} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => product.id && handleDeleteProduct(product.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white">{product.name}</h3>
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {product.duration || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-2xl font-black text-emerald-500 font-mono">{formatCurrency(product.price)}</p>
                      <div className="flex items-center gap-1">
                        <button 
                          disabled={actionLoading === `price-${product.id}`}
                          onClick={() => handleQuickPriceUpdate(product, -10)}
                          className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                        >
                          -10
                        </button>
                        <button 
                          disabled={actionLoading === `price-${product.id}`}
                          onClick={() => handleQuickPriceUpdate(product, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                        >
                          -1
                        </button>
                        <button 
                          disabled={actionLoading === `price-${product.id}`}
                          onClick={() => handleQuickPriceUpdate(product, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                        >
                          +1
                        </button>
                        <button 
                          disabled={actionLoading === `price-${product.id}`}
                          onClick={() => handleQuickPriceUpdate(product, 10)}
                          className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
