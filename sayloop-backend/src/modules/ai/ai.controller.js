const { suggestNicknames } = require('./nameService');
const { generateStuckPrompts } = require('./stuckService');
const { generateCoachingNarrative } = require('./coachingService');

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
    const { transcript, topicId, durationSeconds } = req.body || {};
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId required' });
    }
    const result = await generateCoachingNarrative({
      transcript: String(transcript || ''),
      topicId: String(topicId),
      durationSeconds: Number(durationSeconds) || 60,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNicknameSuggestions, getStuckPrompts, postCoachingAnalyze };
