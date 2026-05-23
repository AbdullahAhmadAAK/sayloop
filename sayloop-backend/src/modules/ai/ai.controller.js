const { suggestNicknames } = require('./nameService');

async function getNicknameSuggestions(req, res, next) {
  try {
    const { firstName, lastName } = req.body || {};
    const result = await suggestNicknames({ firstName, lastName });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNicknameSuggestions };
