const { suggestNicknames } = require('./nameService');
const { generateStuckPrompts } = require('./stuckService');
const { generateCoachingNarrative } = require('./coachingService');
const { transcribeDebateAudio } = require('./transcribeService');

async function getNicknameSuggestions(req, res, next) {
  try {
    const { firstName, lastName, seed } = req.body || {};
    const result = await suggestNicknames({ firstName, lastName, seed });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getStuckPrompts(req, res, next) {
  try {
    const topicId = req.body?.topicId || req.body?.topic;
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId required' });
    }
    const refresh = Boolean(req.body?.refresh);
    const result = await generateStuckPrompts(String(topicId), { refresh });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function postCoachingAnalyze(req, res, next) {
  try {
    const { transcript, topicId, durationSeconds, lines, sessionStartMs } = req.body || {};
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId required' });
    }
    const result = await generateCoachingNarrative({
      transcript: String(transcript || ''),
      topicId: String(topicId),
      durationSeconds: Number(durationSeconds) || 60,
      lines: Array.isArray(lines) ? lines : [],
      sessionStartMs: Number(sessionStartMs) || 0,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function postTranscribeDebate(req, res, next) {
  try {
    let buffer = null;
    let mimeType = 'audio/webm';

    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      buffer = req.body;
      mimeType = req.headers['content-type'] || mimeType;
    } else {
      const { audioBase64, mimeType: bodyMime } = req.body || {};
      if (!audioBase64) {
        return res.status(400).json({
          success: false,
          message: 'Send audio as raw body (Content-Type: audio/webm) or JSON audioBase64',
        });
      }
      buffer = Buffer.from(String(audioBase64), 'base64');
      mimeType = bodyMime || mimeType;
    }

    const result = await transcribeDebateAudio(buffer, mimeType);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[ai] transcribe-debate', err.message);
    next(err);
  }
}

module.exports = {
  getNicknameSuggestions,
  getStuckPrompts,
  postCoachingAnalyze,
  postTranscribeDebate,
};
