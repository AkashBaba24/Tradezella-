import React, { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, Package, User, Mail, DollarSign, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../utils';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

const Checkout: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    product: '',
    amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setProducts(data);
          
          // Set default product if available
          if (data.length > 0) {
            setFormData(prev => ({
              ...prev,
              product: data[0].name,
              amount: data[0].price
            }));
          } else {
            // Fallback to defaults if no products in DB
            setFormData(prev => ({
              ...prev,
              product: 'MicroZella Pro (Annual)',
              amount: 99.99
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        // Fallback
        setFormData(prev => ({
          ...prev,
          product: 'MicroZella Pro (Annual)',
          amount: 99.99
        }));
      } finally {
        setFetchingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = typeof result.error === 'string' ? result.error : (result.error?.message || 'Failed to submit order');
        const detailMessage = result.details ? ` (${JSON.stringify(result.details)})` : '';
        throw new Error(`${errorMessage}${detailMessage}`);
      }

      setSuccess(true);
      setFormData({
        customerName: '',
        customerEmail: '',
        product: 'MicroZella Pro (Annual)',
        amount: 99.99,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Order Successful!</h1>
        <p className="text-zinc-400 text-lg">
          Thank you for your purchase. Your order has been securely stored in our Supabase database.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Join to Premium</h1>
        <p className="text-zinc-400">Upgrade your trading experience with our premium tools.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-emerald-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} className="text-emerald-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-emerald-500" />
                Select Product
              </label>
              {fetchingProducts ? (
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-500 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading products...
                </div>
              ) : (
                <select
                  value={formData.product}
                  onChange={(e) => {
                    const productName = e.target.value;
                    const selectedProduct = products.find(p => p.name === productName);
                    
                    if (selectedProduct) {
                      setFormData({ ...formData, product: productName, amount: selectedProduct.price });
                    } else {
                      // Handle fallback cases
                      let amount = 99.99;
                      if (productName.includes('Monthly')) amount = 12.99;
                      else if (productName.includes('Analytics')) amount = 49.99;
                      setFormData({ ...formData, product: productName, amount });
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                >
                  {products.length > 0 ? (
                    products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} - ${p.price}</option>
                    ))
                  ) : (
                    <>
                      <option value="MicroZella Pro (Annual)">MicroZella Pro (Annual) - $99.99</option>
                      <option value="MicroZella Pro (Monthly)">MicroZella Pro (Monthly) - $12.99</option>
                      <option value="Advanced Analytics Add-on">Advanced Analytics Add-on - $49.99</option>
                    </>
                  )}
                </select>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Complete Purchase
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart size={20} className="text-emerald-500" />
              Order Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-bold">{formData.product}</p>
                  <p className="text-zinc-500 text-xs">Full access to all features</p>
                </div>
                <p className="text-white font-mono">${formData.amount}</p>
              </div>
              
              <div className="h-px bg-zinc-800" />
              
              <div className="flex justify-between items-center text-zinc-500 text-sm">
                <span>Subtotal</span>
                <span className="font-mono">${formData.amount}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-500 text-sm">
                <span>Tax (0%)</span>
                <span className="font-mono">$0.00</span>
              </div>
              
              <div className="h-px bg-zinc-800" />
              
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">Total</span>
                <span className="text-emerald-500 text-2xl font-black font-mono">${formData.amount}</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={10} className="text-emerald-500" />
                Database Integration
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your order data will be securely stored in the Supabase project: 
                <span className="text-emerald-500 block font-mono mt-1">zvltcdqozsetlqzhqvqt</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
