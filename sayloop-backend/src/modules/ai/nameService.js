const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../../config/env');

const FALLBACK_SUFFIXES = ['star', 'loop', 'spark', 'wave', 'fox', 'bolt', 'nova', 'echo'];

function fallbackNicknames(firstName) {
  const base = (firstName || 'user').toLowerCase().replace(/[^a-z]/g, '') || 'say';
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  return [
    `${cap}star`,
    `${base}loop`,
    `${cap}Spark`,
    `${base}nova`,
    `${cap}Wave`,
  ];
}

async function suggestNicknames({ firstName, lastName }) {
  const trimmed = (firstName || '').trim();
  if (!trimmed) {
    return { suggestions: fallbackNicknames('friend'), source: 'fallback' };
  }

  if (!geminiApiKey) {
    return { suggestions: fallbackNicknames(trimmed), source: 'fallback' };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You generate fun, gender-neutral online debate nicknames for a language-learning app.

Given the person's real first name: "${trimmed}"${lastName ? ` (family name hint only, do not use directly): "${lastName.trim()}"` : ''}

Rules:
- Create 5 unique nicknames inspired by the first name's sound or letters (e.g. Saad → SajaStar, SaadLoop) — this is only an example style.
- Do NOT reveal or imply gender (no Mr/Ms, prince/princess, king/queen, boy/girl).
- No real full names. Max 16 characters. Alphanumeric only (letters and numbers).
- Playful, friendly, suitable for teens and adults.
- Return ONLY a JSON array of 5 strings, nothing else. Example: ["Nick1","Nick2","Nick3","Nick4","Nick5"]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid Gemini response');
    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions = parsed
      .filter((s) => typeof s === 'string' && /^[a-zA-Z0-9]{2,16}$/.test(s))
      .slice(0, 5);
    if (suggestions.length < 3) throw new Error('Too few suggestions');
    return { suggestions, source: 'gemini' };
  } catch (err) {
    console.warn('[ai] Gemini nickname failed:', err.message);
    return { suggestions: fallbackNicknames(trimmed), source: 'fallback' };
  }
}

module.exports = { suggestNicknames, fallbackNicknames };
