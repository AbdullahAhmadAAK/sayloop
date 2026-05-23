/** In-memory online users (per server process). */

const onlineByUserId = new Map();

function formatPresenceUser(dbUser) {
  const xp = dbUser.xp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const titles = ['Newbie', 'Speaker', 'Debater', 'Pro', 'Master'];
  const nickname = dbUser.nickname || dbUser.firstName || 'Learner';
  const avatarUrl =
    dbUser.pfpSource ||
    (dbUser.avatarStyle && dbUser.avatarSeed
      ? `https://api.dicebear.com/7.x/${dbUser.avatarStyle}/svg?seed=${encodeURIComponent(dbUser.avatarSeed)}`
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nickname)}`);

  return {
    id: String(dbUser.id),
    nickname,
    avatarUrl,
    level,
    levelTitle: titles[Math.min(level - 1, titles.length - 1)] || 'Newbie',
    languages: [dbUser.learningLanguage || 'English'],
    streak: dbUser.streak ?? 0,
    winRate: 50,
  };
}

function setUserOnline(userId, socketId, dbUser, page = '/') {
  onlineByUserId.set(userId, {
    socketId,
    page,
    connectedAt: Date.now(),
    user: formatPresenceUser(dbUser),
  });
}

function setUserPage(userId, page) {
  const entry = onlineByUserId.get(userId);
  if (entry) entry.page = page;
}

function removeUser(userId) {
  onlineByUserId.delete(userId);
}

function getOnlineUsers(excludeUserId) {
  const list = [];
  for (const [id, entry] of onlineByUserId) {
    if (id !== excludeUserId) list.push(entry.user);
  }
  return list;
}

function getSocketId(userId) {
  return onlineByUserId.get(userId)?.socketId ?? null;
}

function isOnline(userId) {
  return onlineByUserId.has(userId);
}

module.exports = {
  formatPresenceUser,
  setUserOnline,
  setUserPage,
  removeUser,
  getOnlineUsers,
  getSocketId,
  isOnline,
};
