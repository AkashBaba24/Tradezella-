import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Save, Plus, BookOpen, Clock } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import { DailyJournal } from '../types';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils';

const Journal: React.FC = () => {
  const { user } = useAuth();
  const [journals, setJournals] = useState<DailyJournal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<DailyJournal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'journals'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyJournal));
      setJournals(data);
      if (data.length > 0 && !selectedJournal) {
        setSelectedJournal(data[0]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedJournal) {
      setContent(selectedJournal.content);
      setDate(selectedJournal.date);
    } else {
      setContent('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [selectedJournal]);

  const handleSave = async () => {
    if (!user) return;

    const path = `users/${user.uid}/journals`;
    const journalData = {
      date,
      content,
      uid: user.uid,
    };

    try {
      if (selectedJournal?.id) {
        await updateDoc(doc(db, path, selectedJournal.id), journalData);
      } else {
        await addDoc(collection(db, path), journalData);
      }
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, selectedJournal?.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading Journal</h1>
          <p className="text-zinc-400">Reflect on your trades and document your journey.</p>
        </div>
        <button
          onClick={() => { setSelectedJournal(null); setIsEditing(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
        >
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: History */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-2">History</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {journals.map((j) => (
              <button
                key={j.id}
                onClick={() => { setSelectedJournal(j); setIsEditing(false); }}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all group",
                  selectedJournal?.id === j.id
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                    : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon size={14} />
                  <span className="text-sm font-bold">{format(parseISO(j.date), 'MMM dd, yyyy')}</span>
                </div>
                <p className="text-xs line-clamp-2 opacity-70">{j.content}</p>
              </button>
            ))}
            {journals.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm italic">
                No entries yet. Start journaling today!
              </div>
            )}
          </div>
        </div>

        {/* Main: Editor/Viewer */}
        <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-emerald-500">
                <BookOpen size={20} />
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedJournal ? format(parseISO(selectedJournal.date), 'MMMM dd, yyyy') : 'Select an entry'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock size={12} />
                    <span>Last updated recently</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </>
              ) : (
                selectedJournal && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Edit Entry
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts, plans, and lessons learned..."
                className="w-full h-full bg-transparent text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none text-lg leading-relaxed"
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                {selectedJournal ? (
                  <ReactMarkdown>{selectedJournal.content}</ReactMarkdown>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4">
                    <BookOpen size={48} className="opacity-20" />
                    <p className="text-lg italic">Choose an entry from the sidebar to read or create a new one.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
