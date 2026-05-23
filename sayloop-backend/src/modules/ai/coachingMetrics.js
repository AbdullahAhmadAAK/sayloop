const FILLER_PHRASES = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'right'];

const PAUSE_GAP_SEC = 1.2;
const WINDOW_SEC = 10;

function countFillers(transcript) {
  const lower = transcript.toLowerCase();
  const fillerCounts = {};
  let fillerTotal = 0;

  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/\s/g, '\\s+')}\\b`, 'gi');
    const matches = lower.match(re);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      fillerCounts[phrase] = count;
      fillerTotal += count;
    }
  }

  return { fillerTotal, fillerCounts };
}

function computePauses(lines, sessionStartMs) {
  const pauses = [];
  if (!lines.length) return pauses;

  const sorted = [...lines].sort((a, b) => a.at - b.at);

  if (sorted[0].at - sessionStartMs > PAUSE_GAP_SEC * 1000) {
    pauses.push({
      start: 0,
      end: (sorted[0].at - sessionStartMs) / 1000,
      duration: (sorted[0].at - sessionStartMs) / 1000,
    });
  }

  for (let i = 1; i < sorted.length; i++) {
    const gapSec = (sorted[i].at - sorted[i - 1].at) / 1000;
    if (gapSec >= PAUSE_GAP_SEC) {
      pauses.push({
        start: (sorted[i - 1].at - sessionStartMs) / 1000,
        end: (sorted[i].at - sessionStartMs) / 1000,
        duration: gapSec,
      });
    }
  }

  return pauses;
}

function wpmLabel(wpm) {
  if (wpm < 90) return 'slow';
  if (wpm > 150) return 'fast';
  return 'steady';
}

function speedVariationLabel(delta) {
  if (delta < 15) return 'steady';
  if (delta < 35) return 'moderate';
  return 'variable';
}

function pitchLabelFromVariance(hz) {
  if (hz < 18) return 'flat';
  if (hz > 38) return 'expressive';
  return 'steady';
}

/** WPM in fixed windows across the session. */
function computeWpmWindows(lines, durationSeconds, sessionStartMs) {
  const windows = [];
  const numWindows = Math.max(1, Math.ceil(durationSeconds / WINDOW_SEC));

  for (let w = 0; w < numWindows; w++) {
    const winStart = sessionStartMs + w * WINDOW_SEC * 1000;
    const winEnd = winStart + WINDOW_SEC * 1000;
    const wordsInWindow = lines
      .filter((l) => l.at >= winStart && l.at < winEnd)
      .reduce((sum, l) => sum + l.text.trim().split(/\s+/).filter(Boolean).length, 0);
    const wpm = Math.round((wordsInWindow / WINDOW_SEC) * 60);
    windows.push(wpm);
  }

  return windows.length ? windows : [0];
}

function computeSpeedVariation(wpmWindows) {
  if (wpmWindows.length < 2) return { speedVariation: 0, speedVariationLabel: 'steady' };
  const avg = wpmWindows.reduce((a, b) => a + b, 0) / wpmWindows.length;
  const maxDev = Math.max(...wpmWindows.map((w) => Math.abs(w - avg)));
  const speedVariation = Math.round(maxDev);
  return { speedVariation, speedVariationLabel: speedVariationLabel(speedVariation) };
}

/** Rhythm-based estimate when no audio waveform (prosody from speech timing). */
function estimatePitchVariance(lines) {
  if (lines.length < 3) {
    return { pitchVariance: 15, pitchLabel: 'steady' };
  }

  const sorted = [...lines].sort((a, b) => a.at - b.at);
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    const dt = sorted[i].at - sorted[i - 1].at;
    if (dt > 80 && dt < 15000) intervals.push(dt);
  }

  if (intervals.length < 2) {
    return { pitchVariance: 15, pitchLabel: 'steady' };
  }

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((s, x) => s + (x - mean) ** 2, 0) / intervals.length;
  const cv = Math.sqrt(variance) / mean;
  const pitchVariance = Math.round(Math.min(65, Math.max(8, cv * 42 + 10)));

  return { pitchVariance, pitchLabel: pitchLabelFromVariance(pitchVariance) };
}

/**
 * @param {string} transcript
 * @param {number} durationSeconds
 * @param {{ text: string, at: number }[]} [lines]
 * @param {number} [sessionStartMs]
 */
function computeSpeakingMetrics(transcript, durationSeconds, lines = [], sessionStartMs = 0) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const duration = Math.max(durationSeconds, 1);
  const wpm = Math.round((wordCount / duration) * 60);
  const { fillerTotal, fillerCounts } = countFillers(transcript);

  const sortedLines = Array.isArray(lines) ? [...lines].sort((a, b) => a.at - b.at) : [];
  const startMs = sessionStartMs || sortedLines[0]?.at || Date.now();
  const pauses = computePauses(sortedLines, startMs);
  const wpmWindows = computeWpmWindows(sortedLines, duration, startMs);
  const { speedVariation, speedVariationLabel } = computeSpeedVariation(wpmWindows);
  const { pitchVariance, pitchLabel } = estimatePitchVariance(sortedLines);

  return {
    wordCount,
    wpm,
    wpmLabel: wpmLabel(wpm),
    fillerTotal,
    fillerCounts,
    pitchVariance,
    pitchLabel,
    speedVariation,
    speedVariationLabel,
    pauseCount: pauses.length,
    pauses,
    wpmWindows,
    durationSeconds: duration,
  };
}

module.exports = {
  computeSpeakingMetrics,
  countFillers,
  FILLER_PHRASES,
};
