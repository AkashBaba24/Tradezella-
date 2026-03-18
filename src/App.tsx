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
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <button
            onClick={signIn}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-lg"
          >
            Get Started for Free
            <ArrowRight size={20} />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all border border-zinc-800 text-lg">
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
