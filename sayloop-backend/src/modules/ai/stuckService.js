const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../../config/env');
const { getTopic, isValidTopicId } = require('../../config/topics');

/** @type {Map<string, { prompts: string[], expiresAt: number, source: string }>} */
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

const FALLBACK_BY_TOPIC = {
  social_media: [
    'What is one way social media helped you connect with someone real?',
    'Can you give an example of when online life felt less authentic than in person?',
    'Would you rather lose your feed for a month or lose in-person hangouts for a month?',
  ],
  ai_teachers: [
    'What can a human teacher do that AI still struggles with today?',
    'Have you ever learned something faster from a person than from an app?',
    'Should schools ban AI homework help, or teach students to use it wisely?',
  ],
  money_happiness: [
    'Does money remove stress, or create new kinds of pressure?',
    'What free experience made you happier than something you bought?',
    'If you had enough money for needs, what would you chase next?',
  ],
  degree_vs_skills: [
    'Which skill helped you more than any grade on a report card?',
    'Would you hire someone with a great portfolio but no degree?',
    'Is a university degree still worth the cost in your country?',
  ],
  cancel_culture: [
    'When should someone be allowed to move on from a past mistake?',
    'Is calling people out online accountability or pile-on culture?',
    'Have you ever changed your mind after hearing a sincere apology?',
  ],
  gaming_career: [
    'What skills from gaming could transfer to school or work?',
    'Where is the line between healthy gaming and harmful addiction?',
    'Should parents support a teen who wants a career in esports?',
  ],
  privacy_convenience: [
    'What app permission do you refuse to give, even if it is inconvenient?',
    'Would you trade your location data for a free ride or discount?',
    'Who should own the data companies collect about you?',
  ],
  success_young_age: [
    'What does success mean to you at your age right now?',
    'Is comparing yourself to influencers online fair or harmful?',
    'What is one small win you are proud of this month?',
  ],
};

function fallbackForTopic(topicId) {
  return FALLBACK_BY_TOPIC[topicId] || FALLBACK_BY_TOPIC.social_media;
}

async function generateStuckPrompts(topicId, { refresh = false } = {}) {
  const id = isValidTopicId(topicId) ? topicId : 'social_media';
  const cached = cache.get(id);
  if (!refresh && cached && cached.expiresAt > Date.now()) {
    return { prompts: cached.prompts, source: cached.source };
  }

  const topic = getTopic(id);
  const fallback = fallbackForTopic(id);

  if (!geminiApiKey || !topic) {
    return { prompts: fallback, source: 'fallback' };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You help language learners in a live 1-on-1 debate app.

Debate topic: "${topic.label}"
Core question: ${topic.prompt}

A student is stuck and needs 3 short speaking prompts to continue the conversation in English.
Rules:
- Exactly 3 items
- Each is one sentence they can say out loud (as a question OR a clear opinion)
- Simple B1–B2 English, friendly tone
- Related only to this topic
- No numbering in the strings

Return ONLY a JSON array of 3 strings. Example: ["Prompt one?","Prompt two.","Prompt three?"]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid Gemini response');
    const parsed = JSON.parse(jsonMatch[0]);
    const prompts = parsed
      .filter((s) => typeof s === 'string' && s.trim().length > 10)
      .map((s) => s.trim().slice(0, 200))
      .slice(0, 3);
    if (prompts.length < 2) throw new Error('Too few prompts');

    cache.set(id, { prompts, expiresAt: Date.now() + CACHE_TTL_MS, source: 'gemini' });
    return { prompts, source: 'gemini' };
  } catch (err) {
    console.warn('[ai] stuck prompts failed:', err.message);
    return { prompts: fallback, source: 'fallback' };
  }
}

module.exports = { generateStuckPrompts, fallbackForTopic };
