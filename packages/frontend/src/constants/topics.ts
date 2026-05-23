export type TopicId =
  | 'social_media'
  | 'ai_teachers'
  | 'money_happiness'
  | 'degree_vs_skills'
  | 'cancel_culture'
  | 'gaming_career'
  | 'privacy_convenience'
  | 'success_young_age';

export interface Topic {
  id: TopicId;
  label: string;
  emoji: string;
  prompt: string;
}

export const TOPICS: Topic[] = [
  {
    id: 'social_media',
    label: 'Social Media vs Real Life',
    emoji: '📱',
    prompt: 'Does social media make people fake or more connected?',
  },
  {
    id: 'ai_teachers',
    label: 'Should AI Replace Teachers?',
    emoji: '🤖',
    prompt: 'Can AI teach better than humans in the future?',
  },
  {
    id: 'money_happiness',
    label: 'Money Can Buy Happiness?',
    emoji: '💰',
    prompt: 'What actually makes people happy long term?',
  },
  {
    id: 'degree_vs_skills',
    label: 'College Degree vs Skills',
    emoji: '🎓',
    prompt: 'Are skills more important than university now?',
  },
  {
    id: 'cancel_culture',
    label: 'Cancel Culture',
    emoji: '⚖️',
    prompt: 'Should people be forgiven for old mistakes online?',
  },
  {
    id: 'gaming_career',
    label: 'Gaming: Waste or Career?',
    emoji: '🎮',
    prompt: 'Gaming addiction vs esports opportunities',
  },
  {
    id: 'privacy_convenience',
    label: 'Privacy vs Convenience',
    emoji: '🔒',
    prompt: 'Are apps collecting too much personal data?',
  },
  {
    id: 'success_young_age',
    label: 'Success at Young Age',
    emoji: '🌟',
    prompt: 'Pressure on teenagers to become successful early',
  },
];

/** Legacy topic ids from older builds — map to current topics for display. */
const LEGACY_TOPIC_MAP: Record<string, TopicId> = {
  daily_life: 'social_media',
  travel: 'success_young_age',
  technology: 'ai_teachers',
  food: 'money_happiness',
  sports: 'gaming_career',
  work_study: 'degree_vs_skills',
  entertainment: 'cancel_culture',
  future_goals: 'success_young_age',
};

export function normalizeTopicId(id: string): TopicId {
  if (TOPICS.some((t) => t.id === id)) return id as TopicId;
  return LEGACY_TOPIC_MAP[id] ?? 'social_media';
}

export function getTopic(id: string): Topic | undefined {
  const normalized = normalizeTopicId(id);
  return TOPICS.find((t) => t.id === normalized);
}
