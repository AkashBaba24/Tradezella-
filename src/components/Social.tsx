import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Search, 
  Check, 
  X, 
  Send,
  Share2,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  or
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuth } from './AuthContext';
import { FriendRequest, Message, UserProfile, Trade, OperationType } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface SocialProps {
  trades: Trade[];
}

const Social: React.FC<SocialProps> = ({ trades }) => {
  const { user, profile } = useAuth();
  const [activeView, setActiveView] = useState<'friends' | 'requests' | 'search' | 'community'>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [allRequests, setAllRequests] = useState<FriendRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [communityMessages, setCommunityMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { displayName: string, timestamp: string }>>({});
  const [newMessage, setNewMessage] = useState('');
  const [isSharingTrade, setIsSharingTrade] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Fetch Community Messages
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'communityMessages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setCommunityMessages(msgs);
    }, (error) => {
      console.error('Community messages snapshot error:', error);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Typing Status
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'typing');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typing: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Only show typing status if it's recent (within 5 seconds)
        const timestamp = new Date(data.timestamp).getTime();
        const now = Date.now();
        if (data.isTyping && doc.id !== user.uid && (now - timestamp) < 5000) {
          typing[doc.id] = data;
        }
      });
      setTypingUsers(typing);
    });
    return () => unsubscribe();
  }, [user]);

  // Update my typing status
  useEffect(() => {
    if (!user || !profile || activeView !== 'community' || !newMessage.trim()) {
      if (user) {
        // Clear typing status when not typing or not in community
        const path = `typing/${user.uid}`;
        const clearTyping = async () => {
          try {
            await deleteDoc(doc(db, 'typing', user.uid));
          } catch (e) {}
        };
        clearTyping();
      }
      return;
    }

    const path = `typing/${user.uid}`;
    const updateTyping = async () => {
      try {
        const typingRef = doc(db, 'typing', user.uid);
        await writeBatch(db).set(typingRef, {
          isTyping: true,
          displayName: profile.displayName || 'Anonymous',
          timestamp: new Date().toISOString()
        }).commit();
      } catch (e) {
        console.error('Typing update error:', e);
      }
    };

    const timeout = setTimeout(updateTyping, 500);
    return () => clearTimeout(timeout);
  }, [user, profile, activeView, newMessage]);

  // Fetch Incoming Requests
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
      setIncomingRequests(requests);
    }, (error) => {
      console.error('Incoming requests snapshot error:', error);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Outgoing Requests
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('senderUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
      setOutgoingRequests(requests);
    }, (error) => {
      console.error('Outgoing requests snapshot error:', error);
    });
    return () => unsubscribe();
  }, [user]);

  // Combined requests for duplicate checking
  useEffect(() => {
    setAllRequests([...incomingRequests, ...outgoingRequests]);
  }, [incomingRequests, outgoingRequests]);

  // Fetch Friends
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'users', user.uid, 'friends');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendIds = snapshot.docs.map(doc => doc.id);
      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }
      
      // Fetch friend profiles
      const profiles: UserProfile[] = [];
      for (const id of friendIds) {
        const profileSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', id)));
        if (!profileSnap.empty) {
          profiles.push(profileSnap.docs[0].data() as UserProfile);
        }
      }
      setFriends(profiles);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Incoming Requests - REMOVED (combined above)
  // Fetch Outgoing Requests - REMOVED (combined above)

  // Fetch Messages for Selected Friend
  useEffect(() => {
    if (!user || !selectedFriend) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('senderUid', 'in', [user.uid, selectedFriend.uid]),
      where('receiverUid', 'in', [user.uid, selectedFriend.uid]),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        // Filter manually because 'in' query doesn't guarantee both directions correctly for private chat
        .filter(m => 
          (m.senderUid === user.uid && m.receiverUid === selectedFriend.uid) ||
          (m.senderUid === selectedFriend.uid && m.receiverUid === user.uid)
        );
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, selectedFriend]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !user) return;
    
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', searchQuery.trim().toLowerCase())
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(p => p.uid !== user.uid);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (receiver: UserProfile) => {
    if (!user || !profile) return;
    
    // Check if request already exists
    const existing = allRequests.find(r => 
      (r.senderUid === user.uid && r.receiverUid === receiver.uid) ||
      (r.senderUid === receiver.uid && r.receiverUid === user.uid)
    );
    
    if (existing) {
      setStatusMessage({ text: 'A friend request is already pending.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    // Check if already friends
    if (friends.some(f => f.uid === receiver.uid)) {
      setStatusMessage({ text: 'You are already friends.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const path = 'friendRequests';
    try {
      await addDoc(collection(db, path), {
        senderUid: user.uid,
        senderName: profile.displayName || 'Anonymous',
        receiverUid: receiver.uid,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      setStatusMessage({ text: 'Friend request sent!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      setStatusMessage({ text: 'Failed to send request.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const unfriend = async (friendUid: string) => {
    if (!user || !confirm('Are you sure you want to unfriend this user?')) return;
    
    try {
      const batch = writeBatch(db);
      
      // 1. Remove from my friends
      batch.delete(doc(db, 'users', user.uid, 'friends', friendUid));
      
      // 2. Remove from their friends
      batch.delete(doc(db, 'users', friendUid, 'friends', user.uid));
      
      await batch.commit();
      if (selectedFriend?.uid === friendUid) {
        setSelectedFriend(null);
      }
    } catch (error) {
      console.error('Unfriend error:', error);
    }
  };

  const acceptRequest = async (request: FriendRequest) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);

      // 1. Update request status to accepted
      const requestRef = doc(db, 'friendRequests', request.id!);
      batch.update(requestRef, { status: 'accepted' });

      // 2. Add sender to current user's friends list
      const myFriendRef = doc(collection(db, 'users', user.uid, 'friends'), request.senderUid);
      batch.set(myFriendRef, {
        uid: request.senderUid,
        addedAt: serverTimestamp(),
        requestId: request.id
      });

      // 3. Add current user to sender's friends list
      const theirFriendRef = doc(collection(db, 'users', request.senderUid, 'friends'), user.uid);
      batch.set(theirFriendRef, {
        uid: user.uid,
        addedAt: serverTimestamp(),
        requestId: request.id
      });

      await batch.commit();
    } catch (error) {
      console.error('Accept request error:', error);
    }
  };

  const rejectRequest = async (request: FriendRequest) => {
    try {
      await updateDoc(doc(db, 'friendRequests', request.id!), {
        status: 'rejected'
      });
    } catch (error) {
      console.error('Reject request error:', error);
    }
  };

  const sendMessage = async (sharedTrade?: Trade) => {
    if (!user || (!newMessage.trim() && !sharedTrade)) return;
    if (activeView === 'friends' && !selectedFriend) return;

    const isCommunity = activeView === 'community';
    const path = isCommunity ? 'communityMessages' : 'messages';
    
    try {
      await addDoc(collection(db, path), {
        senderUid: user.uid,
        senderName: profile?.displayName || 'Anonymous',
        senderPhoto: profile?.photoURL || null,
        receiverUid: isCommunity ? 'community' : selectedFriend?.uid,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        sharedTradeId: sharedTrade?.id || null,
        sharedTrade: sharedTrade ? {
          symbol: sharedTrade.symbol,
          direction: sharedTrade.direction,
          pnl: sharedTrade.pnl,
          roi: sharedTrade.roi,
          entryPrice: sharedTrade.entryPrice,
          exitPrice: sharedTrade.exitPrice,
          screenshots: sharedTrade.screenshots
        } : null
      });
      setNewMessage('');
      setIsSharingTrade(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Social</h1>
            <p className="text-zinc-500 text-sm">Connect with other traders</p>
          </div>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold z-50 shadow-lg",
                  statusMessage.type === 'success' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                )}
              >
                {statusMessage.text}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setActiveView('community')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeView === 'community' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-white"
            )}
          >
            Community Board
          </button>
          <button
            onClick={() => setActiveView('friends')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeView === 'friends' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-white"
            )}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveView('requests')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
              activeView === 'requests' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-white"
            )}
          >
            Requests
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-zinc-950">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('search')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeView === 'search' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-white"
            )}
          >
            Find Users
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar List */}
        <div className="w-80 flex flex-col bg-zinc-900/50 border border-zinc-800/50 rounded-3xl overflow-hidden">
          {activeView === 'search' && (
            <div className="p-4 border-b border-zinc-800/50">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                />
              </form>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeView === 'friends' && (
              friends.length > 0 ? (
                friends.map(friend => (
                  <button
                    key={friend.uid}
                    onClick={() => setSelectedFriend(friend)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                      selectedFriend?.uid === friend.uid ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                      {friend.photoURL ? (
                        <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold">{friend.displayName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{friend.displayName}</p>
                      <p className="text-xs opacity-60 truncate">{friend.email}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Users size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No friends yet</p>
                </div>
              )
            )}

            {activeView === 'requests' && (
              <div className="space-y-4 p-2">
                {incomingRequests.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-2">Incoming</p>
                    {incomingRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-2xl border border-zinc-800/50">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{req.senderName}</p>
                          <p className="text-[10px] text-zinc-500">{format(new Date(req.timestamp), 'MMM d, h:mm a')}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => acceptRequest(req)} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">
                            <Check size={16} />
                          </button>
                          <button onClick={() => rejectRequest(req)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {outgoingRequests.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-2">Outgoing</p>
                    {outgoingRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-2xl border border-zinc-800/50 opacity-60">
                        <p className="text-sm font-medium text-white truncate">Request sent</p>
                        <Clock size={14} className="text-zinc-500" />
                      </div>
                    ))}
                  </div>
                )}
                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <UserPlus size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                )}
              </div>
            )}

              {activeView === 'search' && (
              <div className="space-y-2">
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  searchResults.map(result => {
                    const isFriend = friends.some(f => f.uid === result.uid);
                    const isPendingIncoming = incomingRequests.some(r => r.senderUid === result.uid);
                    const isPendingOutgoing = outgoingRequests.some(r => r.receiverUid === result.uid);

                    return (
                      <div key={result.uid} className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-2xl transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                            {result.photoURL ? (
                              <img src={result.photoURL} alt={result.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-emerald-500">{result.displayName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{result.displayName}</p>
                            <p className="text-xs text-zinc-500 truncate">{result.email}</p>
                          </div>
                        </div>
                        
                        {isFriend ? (
                          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <UserCheck size={14} />
                            Friend
                          </div>
                        ) : isPendingIncoming ? (
                          <button
                            onClick={() => setActiveView('requests')}
                            className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-all"
                          >
                            Accept Request
                          </button>
                        ) : isPendingOutgoing ? (
                          <div className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg flex items-center gap-1">
                            <Clock size={14} />
                            Pending
                          </div>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(result)}
                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                          >
                            <UserPlus size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800/50 rounded-3xl overflow-hidden">
          {activeView === 'community' || selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeView === 'community' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <Share2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Community Board</p>
                        <p className="text-[10px] text-zinc-500">Global chat for all traders</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                        {selectedFriend?.photoURL ? (
                          <img src={selectedFriend.photoURL} alt={selectedFriend.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-emerald-500">{selectedFriend?.displayName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{selectedFriend?.displayName}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Online
                          </p>
                          <button 
                            onClick={() => selectedFriend && unfriend(selectedFriend.uid)}
                            className="text-[10px] text-red-500 hover:text-red-400 transition-colors font-bold uppercase tracking-wider"
                          >
                            Unfriend
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setIsSharingTrade(!isSharingTrade)}
                  className={cn(
                    "p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-medium",
                    isSharingTrade ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  <Share2 size={16} />
                  <span>Share Trade</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(activeView === 'community' ? communityMessages : messages).map((msg, i) => {
                  const isMe = msg.senderUid === user?.uid;
                  return (
                    <div key={msg.id || i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      {!isMe && activeView === 'community' && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                            {msg.senderPhoto ? (
                              <img src={msg.senderPhoto} alt={msg.senderName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-500">{msg.senderName?.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500">
                            {msg.senderName || 'Anonymous'}
                          </span>
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-2xl space-y-3",
                        isMe ? "bg-emerald-500 text-white rounded-tr-none" : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                      )}>
                        {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                        
                        {msg.sharedTrade && (
                          <div className={cn(
                            "p-3 rounded-xl border",
                            isMe ? "bg-white/10 border-white/20" : "bg-zinc-950/50 border-zinc-700"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Shared Trade</span>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                msg.sharedTrade.direction === 'long' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                              )}>
                                {msg.sharedTrade.direction}
                              </span>
                            </div>
                            <p className="text-lg font-bold mb-1">{msg.sharedTrade.symbol}</p>
                            <div className="flex items-center gap-4 text-xs opacity-80">
                              <div>
                                <p className="opacity-60">PnL</p>
                                <p className={cn("font-bold", (msg.sharedTrade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                                  ${msg.sharedTrade.pnl?.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="opacity-60">ROI</p>
                                <p className="font-bold">{msg.sharedTrade.roi?.toFixed(2)}%</p>
                              </div>
                            </div>
                            {msg.sharedTrade.screenshots && msg.sharedTrade.screenshots.length > 0 && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                                <img src={msg.sharedTrade.screenshots[0]} alt="Trade Screenshot" className="w-full h-auto" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 px-1">
                        {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}
                      </span>
                    </div>
                  );
                })}
                
                {activeView === 'community' && Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-500 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-medium">
                      {Object.values(typingUsers).map(u => u.displayName).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}
              </div>

              {/* Share Trade Picker */}
              <AnimatePresence>
                {isSharingTrade && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-800/50 bg-zinc-900/50 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Select a trade to share</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {trades.slice(0, 5).map(trade => (
                          <button
                            key={trade.id}
                            onClick={() => sendMessage(trade)}
                            className="flex-shrink-0 w-48 p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-all text-left group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold">{trade.symbol}</span>
                              <span className={cn(
                                "text-[10px] font-bold",
                                (trade.pnl || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                              )}>
                                {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '0.00'}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">{format(new Date(trade.entryTime), 'MMM d, yyyy')}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl">
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <MessageSquare size={40} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">Your Messages</p>
                <p className="text-sm max-w-xs">Select a friend to start chatting and sharing your trade insights.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Social;
