/** Debate topics — keep in sync with sayloop-frontend/src/constants/topics.ts */
const TOPICS = [
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

const TOPIC_IDS = new Set(TOPICS.map((t) => t.id));

function isValidTopicId(id) {
  return TOPIC_IDS.has(id);
}

function getTopic(id) {
  return TOPICS.find((t) => t.id === id);
}

module.exports = { TOPICS, TOPIC_IDS, isValidTopicId, getTopic };
