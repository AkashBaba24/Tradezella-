import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './components/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeLog from './components/TradeLog';
import TradeForm from './components/TradeForm';
import Journal from './components/Journal';
import Settings from './components/Settings';
import Checkout from './components/Checkout';
import CalendarView from './components/CalendarView';
import TradeDetails from './components/TradeDetails';
import { Trade } from './types';
import { TrendingUp, Shield, BarChart3, Zap, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { signIn, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signIn();
    setIsSigningIn(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Error Message */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-xl">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={clearError} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <Zap size={16} className="rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-4xl w-full text-center space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-700">
            <Zap size={16} />
            <span>The ultimate trading companion</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Journal like a <span className="text-emerald-500">Professional</span> Trader.
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Track your performance, identify your edge, and eliminate mistakes with the most powerful trading journal for retail traders.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-lg"
            >
              {isSigningIn ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            <p className="text-xs text-zinc-500 font-medium">গুগল দিয়ে সাইন-ইন করার জন্য একটি পপ-আপ ওপেন হবে</p>
            <p className="text-[10px] text-zinc-600">বর্তমানে শুধুমাত্র গুগল দিয়ে সাইন-ইন করা যাবে।</p>
            <p className="text-[10px] text-zinc-600">Currently only Google Sign-In is available.</p>
          </div>
          <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all border border-zinc-800 text-lg sm:mb-7">
            View Demo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          {[
            { icon: BarChart3, title: "Advanced Analytics", desc: "Deep dive into your stats with equity curves and win rate distribution." },
            { icon: Shield, title: "Secure & Private", desc: "Your data is encrypted and stored securely in the cloud." },
            { icon: TrendingUp, title: "Performance Edge", desc: "Identify which setups and symbols are making you the most money." },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isTradeFormOpen, setIsTradeFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'trades'),
      orderBy('entryTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (!user) return;

    const path = `users/${user.uid}/trades`;
    try {
      if (editingTrade?.id) {
        await updateDoc(doc(db, path, editingTrade.id), tradeData);
      } else {
        await addDoc(collection(db, path), {
          ...tradeData,
          uid: user.uid,
        });
      }
      setIsTradeFormOpen(false);
      setEditingTrade(null);
    } catch (error) {
      handleFirestoreError(error, editingTrade?.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/trades/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onAddTrade={() => { setEditingTrade(null); setIsTradeFormOpen(true); }}
    >
      {activeTab === 'dashboard' && <Dashboard trades={trades} />}
      {activeTab === 'trades' && (
        <TradeLog 
          trades={trades} 
          onEdit={(t) => { setEditingTrade(t); setIsTradeFormOpen(true); }}
          onDelete={handleDeleteTrade}
          onView={(t) => setViewingTrade(t)}
        />
      )}
      {activeTab === 'calendar' && (
        <CalendarView 
          trades={trades}
          onEdit={(t) => { setEditingTrade(t); setIsTradeFormOpen(true); }}
          onDelete={handleDeleteTrade}
          onView={(t) => setViewingTrade(t)}
        />
      )}
      {activeTab === 'journal' && <Journal />}
      {activeTab === 'checkout' && <Checkout />}
      {activeTab === 'settings' && <Settings />}

      {isTradeFormOpen && (
        <TradeForm 
          trade={editingTrade}
          onSave={handleSaveTrade}
          onClose={() => { setIsTradeFormOpen(false); setEditingTrade(null); }}
        />
      )}

      {viewingTrade && (
        <TradeDetails 
          trade={viewingTrade}
          onClose={() => setViewingTrade(null)}
          onEdit={(t) => { setEditingTrade(t); setIsTradeFormOpen(true); }}
          onDelete={handleDeleteTrade}
        />
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
