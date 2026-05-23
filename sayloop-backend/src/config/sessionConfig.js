/** Live debate session timing (seconds). */
const SESSION_DURATION_SECONDS = 300; // 5 minutes

/** XP awards per user (hackathon scoring — replace with AI judge later). */
const XP = {
  SESSION_COMPLETE: 50,
  DRAW: 25,
  WIN_ON_RESIGN: 50,
  LOSS_ON_RESIGN: -50,
};

module.exports = {
  SESSION_DURATION_SECONDS,
  XP,
};
