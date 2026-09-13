// controllers/gamificationController.js — XP, Badges, Challenges
const { Achievement, Challenge, User } = require('../models');
const { asyncHandler, createError } = require('../middleware');

/* ─── Get User XP and Level ─── */
exports.getProgress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('xp level streak lastStreakDate lastLoginBonusClaimedAt name avatar');

  const today = new Date(); today.setHours(0,0,0,0);
  const lastClaimed = user.lastLoginBonusClaimedAt || user.lastStreakDate;
  const hasClaimedToday = lastClaimed ? (new Date(lastClaimed) >= today) : false;

  const nextLevelXP = user.level * 100;
  const currentXP   = user.xp % 100;
  const achievements = await Achievement.find({ userId: req.user._id }).sort({ earnedAt: -1 });

  res.json({
    success: true,
    progress: {
      xp: user.xp, level: user.level, streak: user.streak,
      currentLevelXP: currentXP, nextLevelXP,
      progressPercent: Math.round((currentXP / nextLevelXP) * 100),
      hasClaimedDailyBonusToday: hasClaimedToday,
      canClaimDailyBonus: !hasClaimedToday,
    },
    achievements,
  });
});

/* ─── Get Active Challenges ─── */
exports.getChallenges = asyncHandler(async (req, res) => {
  const now = new Date();

  // Auto-create daily challenges if none exist
  let challenges = await Challenge.find({
    userId: req.user._id,
    status: 'active',
    expiresAt: { $gt: now },
  });

  if (challenges.length === 0) {
    challenges = await createDailyChallenges(req.user._id);
  }

  res.json({ success: true, challenges });
});

/* ─── Update Challenge Progress ─── */
exports.updateChallenge = asyncHandler(async (req, res) => {
  const { increment = 1 } = req.body;

  const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user._id, status: 'active' });
  if (!challenge) throw createError('Challenge not found.', 404);

  challenge.current = Math.min(challenge.target, challenge.current + increment);

  if (challenge.current >= challenge.target) {
    challenge.status = 'completed';
    challenge.completedAt = new Date();

    // Award XP and badge
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: challenge.xpReward } });
    await Achievement.create({
      userId: req.user._id,
      type:   'challenge',
      title:  `Completed: ${challenge.title}`,
      description: challenge.description,
      xpAwarded: challenge.xpReward,
      badge: '🏆',
    });
  }

  await challenge.save();
  res.json({ success: true, challenge });
});

/* ─── Leaderboard ─── */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .select('name avatar xp level streak')
    .sort({ xp: -1 })
    .limit(20);

  const leaderboard = users.map((u, idx) => ({
    rank: idx + 1,
    name: u.name,
    avatar: u.avatar,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    isCurrentUser: u._id.equals(req.user._id),
  }));

  res.json({ success: true, leaderboard });
});

/* ─── Daily Login Bonus (1-Time Per Day Limit) ─── */
exports.claimLoginBonus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const today = new Date(); today.setHours(0,0,0,0);

  const lastClaimed = user.lastLoginBonusClaimedAt || user.lastStreakDate;
  if (lastClaimed && new Date(lastClaimed) >= today) {
    return res.status(400).json({
      success: false,
      message: 'You have already claimed your Daily Login XP Bonus for today. Check back tomorrow!',
      alreadyClaimed: true,
      hasClaimedDailyBonusToday: true,
      canClaimDailyBonus: false,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
    });
  }

  const lastStreak = user.lastStreakDate ? new Date(user.lastStreakDate) : null;
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  let bonusXP = 20;
  let message = '🎁 Daily Login XP Bonus Claimed: +20 XP!';

  if (lastStreak && lastStreak >= yesterday && lastStreak < today) {
    // Continue streak
    user.streak = (user.streak || 0) + 1;
    bonusXP = 20 + Math.min(user.streak * 5, 50);
    message = `🔥 ${user.streak}-Day Streak Active! +${bonusXP} Daily XP Bonus Claimed!`;
  } else if (!lastStreak || lastStreak < yesterday) {
    user.streak = 1;
  }

  const now = new Date();
  user.lastStreakDate = now;
  user.lastLoginBonusClaimedAt = now;
  user.xp += bonusXP;
  user.level = Math.floor(user.xp / 100) + 1;
  await user.save({ validateBeforeSave: false });

  // Record achievement log
  await Achievement.create({
    userId: req.user._id,
    type: 'login_bonus',
    title: `Daily Reward: +${bonusXP} XP`,
    description: `Claimed 1-time daily login bonus (${user.streak}-day streak)`,
    xpAwarded: bonusXP,
    badge: '🎁',
  });

  res.json({
    success: true,
    message,
    bonusXP,
    streak: user.streak,
    xp: user.xp,
    level: user.level,
    hasClaimedDailyBonusToday: true,
    canClaimDailyBonus: false,
  });
});

async function createDailyChallenges(userId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59);

  const dailyChallenges = [
    { type: 'daily', title: 'Take All Medicines', description: 'Take all scheduled medicines today', target: 3, xpReward: 30 },
    { type: 'daily', title: 'Drink 8 Glasses', description: 'Drink 2000ml of water', target: 8, xpReward: 20 },
    { type: 'daily', title: 'Log Your Mood', description: 'Log your mood at least once', target: 1, xpReward: 10 },
    { type: 'daily', title: 'Meditate 10 Minutes', description: 'Complete a meditation session', target: 1, xpReward: 25 },
    { type: 'daily', title: 'Log 3 Meals', description: 'Log all 3 meals today', target: 3, xpReward: 20 },
  ];

  return Challenge.insertMany(dailyChallenges.map(c => ({ ...c, userId, expiresAt: tomorrow })));
}
