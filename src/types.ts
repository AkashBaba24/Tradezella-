export type TradeDirection = 'long' | 'short';
export type GoalType = 'daily' | 'weekly' | 'monthly';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  currency?: string;
  timezone?: string;
  riskPerTrade?: number;
  dailyProfitTarget?: number;
  weeklyProfitTarget?: number;
  role?: UserRole;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
  purchasedPlans?: {
    planName: string;
    duration?: string;
    purchasedAt: string;
    expiryDate: string;
  }[];
  isPremium?: boolean;
}

export interface Trade {
  id?: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  targetPrice?: number;
  lots: number;
  contractSize?: number;
  fees?: number;
  setup?: string;
  planFollowed?: boolean;
  mentalState?: string;
  keyLesson?: string;
  notes?: string;
  tags?: string[];
  screenshots?: string[];
  entryTime: string; // ISO 8601
  exitTime?: string; // ISO 8601
  pnl?: number;
  roi?: number;
  riskReward?: number;
  uid: string;
}

export interface DailyJournal {
  id?: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: string;
  plan?: string;
  uid: string;
}

export interface Goal {
  id?: string;
  type: GoalType;
  target: number;
  current?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  uid: string;
}

export interface FriendRequest {
  id?: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface Message {
  id?: string;
  senderUid: string;
  receiverUid: string;
  content: string;
  timestamp: string;
  sharedTradeId?: string;
  sharedTrade?: Partial<Trade>;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
