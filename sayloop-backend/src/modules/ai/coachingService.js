const OpenAI = require('openai');
const { getTopic } = require('../../config/topics');
const { computeSpeakingMetrics } = require('./coachingMetrics');

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function fallbackNarrative(transcript, metrics, topicLabel) {
  if (!transcript || metrics.wordCount < 3) {
    return `You had limited captured speech for "${topicLabel}". Try speaking in longer phrases so we can coach your pace and clarity next round.`;
  }

  const topFillers = Object.entries(metrics.fillerCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([w, c]) => `"${w}" (${c}×)`)
    .join(', ');

  const fillerNote =
    metrics.fillerTotal > 2
      ? ` Cut fillers${topFillers ? ` like ${topFillers}` : ''}.`
      : '';
  const paceNote =
    metrics.wpmLabel === 'fast'
      ? ' Your pace ran fast — slow slightly so your partner can follow.'
      : metrics.wpmLabel === 'slow'
        ? ' Your pace was calm — add one concrete example to strengthen your point.'
        : ' Your pace was easy to follow.';
  const pauseNote =
    metrics.pauseCount > 3
      ? ` You had ${metrics.pauseCount} long pauses — brief silence is fine, but plan your next sentence.`
      : '';

  return `On "${topicLabel}", you spoke about ${metrics.wordCount} words at ${metrics.wpm} WPM.${paceNote}${fillerNote}${pauseNote}`;
}

function buildMetricsBlock(metrics, topic) {
  const topFillers = Object.entries(metrics.fillerCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w, c]) => `"${w}" (${c}×)`)
    .join(', ');

  return [
    `Topic: ${topic.label} — ${topic.prompt}`,
    `Duration: ${metrics.durationSeconds}s`,
    `Words spoken: ${metrics.wordCount}`,
    `Pace: ${metrics.wpm} WPM (${metrics.wpmLabel})`,
    `Pitch variance: ${metrics.pitchVariance} Hz (${metrics.pitchLabel}, estimated from rhythm)`,
    `Filler words: ${metrics.fillerTotal}${metrics.fillerTotal > 0 ? ` — ${topFillers}` : ''}`,
    `Speed variation: ±${metrics.speedVariation} WPM (${metrics.speedVariationLabel})`,
    `Pauses (≥1.2s): ${metrics.pauseCount}`,
  ].join('\n');
}

async function generateCoachingNarrative({
  transcript,
  topicId,
  durationSeconds,
  lines,
  sessionStartMs,
}) {
  const topic = getTopic(topicId) || getTopic('social_media');
  const metrics = computeSpeakingMetrics(
    transcript,
    durationSeconds,
    lines,
    sessionStartMs,
  );
  const openai = getOpenAI();

  if (!openai || !transcript.trim()) {
    return {
      coachingNarrative: fallbackNarrative(transcript, metrics, topic.label),
      metrics,
      source: 'fallback',
    };
  }

  const metricsBlock = buildMetricsBlock(metrics, topic);

  const prompt = `You are a speaking coach. A learner just finished a live 1-on-1 debate in English.

${metricsBlock}

Transcript:
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

module.exports = { generateCoachingNarrative, computeSpeakingMetrics };
