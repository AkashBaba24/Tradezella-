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
import FullScreenImage from './components/FullScreenImage';
import { Trade } from './types';
import { TrendingUp, Shield, BarChart3, Zap, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { signIn, signInWithEmail, signUpWithEmail, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'email-signin' | 'email-signup'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    await signIn();
    setIsSigningIn(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      if (authMode === 'email-signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err) {
      // Error is handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
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
            Journal like a <span className="text-emerald-500">MicroZella</span> Pro.
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Track your performance, identify your edge, and eliminate mistakes with MicroZella—the most powerful trading journal for retail traders.
          </p>
        </div>

        <div className="max-w-md mx-auto w-full bg-zinc-900/50 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {authMode === 'google' ? (
            <div className="space-y-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-lg"
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
                  </>
                )}
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={() => setAuthMode('email-signin')}
                className="w-full py-3 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                Sign in with Email & Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
              <h2 className="text-2xl font-bold text-center mb-6">
                {authMode === 'email-signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              
              {authMode === 'email-signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 mt-4 flex items-center justify-center gap-2"
              >
                {isSigningIn ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  authMode === 'email-signin' ? 'Sign In' : 'Create Account'
                )}
              </button>

              <div className="pt-4 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'email-signin' ? 'email-signup' : 'email-signin')}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {authMode === 'email-signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('google')}
                  className="block w-full text-xs text-zinc-500 hover:text-zinc-400 transition-colors uppercase tracking-widest pt-2"
                >
                  Back to Google Sign In
                </button>
              </div>
            </form>
          )}
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
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

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
          onViewFullScreen={(url) => setFullScreenImageUrl(url)}
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

      {fullScreenImageUrl && (
        <FullScreenImage 
          src={fullScreenImageUrl} 
          alt="Trade Screenshot" 
          onClose={() => setFullScreenImageUrl(null)} 
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
