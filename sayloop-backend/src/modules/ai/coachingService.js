const OpenAI = require('openai');
const { getTopic } = require('../../config/topics');

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function computeMetrics(transcript, durationSeconds) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const duration = Math.max(durationSeconds, 1);
  const wpm = Math.round((wordCount / duration) * 60);
  const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
  let fillerTotal = 0;
  const lower = transcript.toLowerCase();
  for (const f of fillers) {
    const re = new RegExp(`\\b${f.replace(/\s/g, '\\s+')}\\b`, 'gi');
    const m = lower.match(re);
    if (m) fillerTotal += m.length;
  }
  let wpmLabel = 'steady';
  if (wpm < 90) wpmLabel = 'slow';
  else if (wpm > 150) wpmLabel = 'fast';

  return { wordCount, wpm, wpmLabel, fillerTotal, durationSeconds: duration };
}

function fallbackNarrative(transcript, metrics, topicLabel) {
  if (!transcript || metrics.wordCount < 3) {
    return `You had limited captured speech for "${topicLabel}". Try speaking in longer phrases so we can coach your pace and clarity next round.`;
  }
  const fillerNote =
    metrics.fillerTotal > 2
      ? ` You used several filler words — pause briefly instead of saying "um" or "like".`
      : '';
  const paceNote =
    metrics.wpmLabel === 'fast'
      ? ' Your pace was quite fast; slow down so your partner can follow your argument.'
      : metrics.wpmLabel === 'slow'
        ? ' Your pace was calm; try adding one more supporting example to strengthen your point.'
        : ' Your speaking pace was easy to follow.';
  return `On "${topicLabel}", you shared ${metrics.wordCount} words in about ${metrics.durationSeconds} seconds.${paceNote}${fillerNote} Pick one claim you made and add a concrete example next time.`;
}

async function generateCoachingNarrative({ transcript, topicId, durationSeconds }) {
  const topic = getTopic(topicId) || getTopic('social_media');
  const metrics = computeMetrics(transcript, durationSeconds);
  const openai = getOpenAI();

  if (!openai || !transcript.trim()) {
    return {
      coachingNarrative: fallbackNarrative(transcript, metrics, topic.label),
      metrics,
      source: 'fallback',
    };
  }

  const metricsBlock = [
    `Topic: ${topic.label} — ${topic.prompt}`,
    `Duration: ${metrics.durationSeconds}s`,
    `Words spoken: ${metrics.wordCount}`,
    `Pace: ${metrics.wpm} WPM (${metrics.wpmLabel})`,
    `Filler words detected: ${metrics.fillerTotal}`,
  ].join('\n');

  const prompt = `You are a speaking coach. A learner just finished a live 1-on-1 debate in English.

${metricsBlock}

Their speech transcript (may be partial):
"${transcript.slice(0, 4000)}"

Write 2–3 sentences of direct, specific, actionable coaching. Reference what they actually said when possible. No bullet points. No generic praise unless earned. Be honest and concrete.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });
    const narrative =
      response.choices[0]?.message?.content?.trim() ??
      fallbackNarrative(transcript, metrics, topic.label);
    return { coachingNarrative: narrative, metrics, source: 'openai' };
  } catch (err) {
    console.warn('[coaching] OpenAI failed:', err.message);
    return {
      coachingNarrative: fallbackNarrative(transcript, metrics, topic.label),
      metrics,
      source: 'fallback',
    };
  }
}

module.exports = { generateCoachingNarrative, computeMetrics };
