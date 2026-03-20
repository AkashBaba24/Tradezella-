import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Globe, Save, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../utils';
import { format } from 'date-fns';

const Settings: React.FC = () => {
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    currency: profile?.currency || 'USD',
    timezone: profile?.timezone || '',
    riskPerTrade: profile?.riskPerTrade || 1,
    dailyProfitTarget: profile?.dailyProfitTarget || 0,
    weeklyProfitTarget: profile?.weeklyProfitTarget || 0,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        currency: profile.currency || 'USD',
        timezone: profile.timezone || '',
        riskPerTrade: profile.riskPerTrade || 1,
        dailyProfitTarget: profile.dailyProfitTarget || 0,
        weeklyProfitTarget: profile.weeklyProfitTarget || 0,
      });
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const path = `users/${user.uid}`;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, path), formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your profile, preferences, and account security.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'preferences', label: 'Trading Preferences', icon: Globe },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all",
                item.id === 'profile' 
                  ? "bg-emerald-500/10 text-emerald-500 font-medium" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 space-y-8">
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-4">Subscription</h3>
              <div className={cn(
                "rounded-2xl p-6 space-y-4 border transition-all",
                profile?.isPremium 
                  ? "bg-emerald-500/5 border-emerald-500/20" 
                  : "bg-zinc-900 border-zinc-800"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      profile?.isPremium ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                    )}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Plan</p>
                      <p className={cn(
                        "text-xl font-black",
                        profile?.isPremium ? "text-emerald-500" : "text-white"
                      )}>
                        {profile?.subscriptionPlan || 'Free Plan'}
                      </p>
                    </div>
                  </div>
                  {profile?.isPremium && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Expires On</p>
                      <p className="text-sm font-bold text-white">
                        {profile.subscriptionExpiry ? format(new Date(profile.subscriptionExpiry), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
                
                {profile?.purchasedPlans && profile.purchasedPlans.length > 0 && (
                  <div className="pt-4 border-t border-zinc-800/50">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Purchase History</p>
                    <div className="space-y-2">
                      {profile.purchasedPlans.map((purchase, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white">{purchase.planName}</p>
                              {purchase.duration && (
                                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[8px] font-bold rounded uppercase">
                                  {purchase.duration}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Purchased: {format(new Date(purchase.purchasedAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Expires</p>
                            <p className="text-[10px] font-bold text-emerald-500">
                              {format(new Date(purchase.expiryDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!profile?.isPremium && (
                  <p className="text-xs text-zinc-500 italic">
                    Upgrade to Premium to unlock advanced social features and unlimited trade sharing.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    disabled
                    type="email"
                    value={profile?.email || ''}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-4">Trading Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Base Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Risk Per Trade (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.riskPerTrade}
                    onChange={(e) => setFormData({ ...formData, riskPerTrade: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Daily Profit Target</label>
                  <input
                    type="number"
                    value={formData.dailyProfitTarget}
                    onChange={(e) => setFormData({ ...formData, dailyProfitTarget: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Weekly Profit Target</label>
                  <input
                    type="number"
                    value={formData.weeklyProfitTarget}
                    onChange={(e) => setFormData({ ...formData, weeklyProfitTarget: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
              <div className={cn(
                "flex items-center gap-2 text-emerald-500 transition-opacity duration-500",
                showSuccess ? "opacity-100" : "opacity-0"
              )}>
                <CheckCircle size={20} />
                <span className="text-sm font-medium">Settings saved successfully!</span>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
