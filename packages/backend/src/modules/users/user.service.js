const usersRepo = require('../../db/users.repo');

async function syncUser(clerkId, payload) {
  return usersRepo.upsertFromClerk(clerkId, payload);
}

async function updateProfile(clerkId, data) {
  return usersRepo.updateProfile(clerkId, data);
}

async function getUserByClerkId(clerkId) {
  return usersRepo.findByClerkId(clerkId);
}

module.exports = { syncUser, updateProfile, getUserByClerkId };
