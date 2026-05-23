import type { TopicId } from '@/constants/topics';

export interface PartnerUser {
  id: string;
  nickname: string;
  avatarUrl: string;
  level: number;
  levelTitle: string;
  languages: string[];
  streak: number;
  winRate: number;
}

export interface MatchRequest {
  id: string;
  requester: PartnerUser;
  topic: TopicId;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export type MatchMode =
  | 'browse'
  | 'waiting'
  | 'matched'
  | 'confirmed';

export type SessionPhase = 'joining' | 'active' | 'ended';

export type DebateOutcome = 'WIN' | 'LOSS' | 'DRAW' | 'COMPLETE';

export interface SessionResult {
  outcome: DebateOutcome;
  xpEarned: number;
  speakingSeconds: number;
  opponentSeconds: number;
  topic: TopicId;
  partnerName: string;
}
