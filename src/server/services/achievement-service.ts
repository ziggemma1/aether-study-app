import { User } from '../models/User.js';
import { StudySession } from '../models/StudySession.js';
import { QuizResult } from '../models/QuizResult.js';
import { Material } from '../models/Material.js';
import { FriendRequest } from '../models/FriendRequest.js';

export interface PredefinedBadge {
  id: string;
  title: string;
  description: string;
  target: number;
  category: 'streak' | 'time' | 'quiz' | 'material' | 'social';
  icon: string;
  points: number;
}

export const PREDEFINED_BADGES: PredefinedBadge[] = [
  // Streak
  { id: 'streak_1_day', title: 'First Step', description: 'Study 1 day in a row', target: 1, category: 'streak', icon: 'Star', points: 50 },
  { id: 'streak_7_days', title: 'Week Warrior', description: 'Study 7 days in a row', target: 7, category: 'streak', icon: 'Calendar', points: 100 },
  { id: 'streak_30_days', title: 'Month Master', description: 'Study 30 days in a row', target: 30, category: 'streak', icon: 'Calendar', points: 200 },
  { id: 'streak_90_days', title: 'Quarter Champion', description: 'Study 90 days in a row', target: 90, category: 'streak', icon: 'Trophy', points: 350 },
  { id: 'streak_365_days', title: 'Year Legend', description: 'Study 365 days in a row', target: 365, category: 'streak', icon: 'Trophy', points: 1000 },

  // Time
  { id: 'time_1_hour', title: 'Curious Mind', description: 'Reach 1 hour of total study time', target: 60, category: 'time', icon: 'Zap', points: 50 },
  { id: 'time_10_hours', title: 'Knowledge Seeker', description: 'Reach 10 hours of total study time', target: 600, category: 'time', icon: 'Zap', points: 150 },
  { id: 'time_50_hours', title: 'Scholar', description: 'Reach 50 hours of total study time', target: 3000, category: 'time', icon: 'Award', points: 300 },
  { id: 'time_100_hours', title: 'Academic', description: 'Reach 100 hours of total study time', target: 6000, category: 'time', icon: 'Award', points: 500 },
  { id: 'time_500_hours', title: 'Master', description: 'Reach 500 hours of total study time', target: 30000, category: 'time', icon: 'Trophy', points: 1500 },

  // Quiz
  { id: 'quiz_first', title: 'First Try', description: 'Complete your first study quiz', target: 1, category: 'quiz', icon: 'Target', points: 50 },
  { id: 'quiz_perfect', title: 'Perfect Score', description: 'Get 100% on a quiz (min 5 questions)', target: 1, category: 'quiz', icon: 'Target', points: 150 },
  { id: 'quiz_count_20', title: 'Quiz Machine', description: 'Complete 20 study quizzes', target: 20, category: 'quiz', icon: 'Target', points: 300 },
  { id: 'quiz_avg_90', title: 'A+ Student', description: 'Average score > 90% (min 10 quizzes)', target: 10, category: 'quiz', icon: 'Award', points: 400 },
  { id: 'quiz_count_50', title: 'Trivia Master', description: 'Complete 50 study quizzes', target: 50, category: 'quiz', icon: 'Trophy', points: 800 },

  // Material
  { id: 'material_5_uploads', title: 'Bookworm', description: 'Upload 5 study materials', target: 5, category: 'material', icon: 'Upload', points: 50 },
  { id: 'material_20_uploads', title: 'Librarian', description: 'Upload 20 study materials', target: 20, category: 'material', icon: 'Upload', points: 200 },
  { id: 'notes_10_summaries', title: 'Note Taker', description: 'Generate 10 textbook summaries', target: 10, category: 'material', icon: 'FileText', points: 150 },
  { id: 'notes_50_flashcards', title: 'Flashcard Guru', description: 'Create 50 study flashcards', target: 50, category: 'material', icon: 'BookOpen', points: 150 },
  { id: 'plans_3_created', title: 'Curriculum Builder', description: 'Create 3 dynamic study plans', target: 3, category: 'material', icon: 'BookOpen', points: 100 },

  // Social
  { id: 'social_3_requests', title: 'Friend Maker', description: 'Send 3 partner friend requests', target: 3, category: 'social', icon: 'MessageSquare', points: 50 },
  { id: 'social_5_rooms', title: 'Study Buddy', description: 'Join 5 co-working live rooms', target: 5, category: 'social', icon: 'MessageSquare', points: 100 },
  { id: 'social_5_accepted', title: 'Popular', description: 'Earn 5 study followers or friends', target: 5, category: 'social', icon: 'MessageSquare', points: 150 },
  { id: 'social_rank_1', title: 'Leader', description: 'Reach rank #1 on the leaderboard', target: 1, category: 'social', icon: 'Trophy', points: 500 },
  { id: 'social_10_hosts', title: 'Mentor', description: 'Host 10 live rooms', target: 10, category: 'social', icon: 'Trophy', points: 300 }
];

export const getBadgeId = (ach: any): string => {
  if (!ach) return '';
  return ach._doc?.id || (typeof ach.get === 'function' ? ach.get('id') : ach.id) || ach.id || '';
};

export async function checkAchievements(userId: string, action?: string, clientData?: any): Promise<any[]> {
  const maxRetries = 5;
  let delay = 50;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await checkAchievementsInternal(userId, action, clientData);
    } catch (error: any) {
      if (error.name === 'VersionError' && attempt < maxRetries) {
        console.warn(`VersionError in checkAchievements (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        console.error('Error in checkAchievements service after max retries:', error);
        return [];
      }
    }
  }
  return [];
}

async function checkAchievementsInternal(userId: string, action?: string, clientData?: any): Promise<any[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  // Ensure user has achievements list initialized
  if (!user.achievements) {
    user.achievements = [];
  }

  let stateModified = false;

  // Deduplicate any existing duplicates in user.achievements
  if (user.achievements.length > 0) {
    const seen = new Set<string>();
    const deduped: any[] = [];
    let foundDupes = false;
    for (const ach of user.achievements) {
      const bId = getBadgeId(ach);
      if (bId && !seen.has(bId)) {
        seen.add(bId);
        deduped.push(ach);
      } else {
        foundDupes = true;
      }
    }
    if (foundDupes) {
      user.achievements = deduped;
      stateModified = true;
    }
  }

  // 1. Gather stats from DB queries
  const sessions = await StudySession.find({ userId });
  const studyHoursInDb = sessions.filter(s => s.type === 'study').reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalMinutes = Math.max(studyHoursInDb, user.totalStudyTime || 0);

  const quizzes = await QuizResult.find({ userId });
  const quizCount = quizzes.length;

  // Check perfect scores on quizzes with >= 5 questions
  const perfectQuizCount = quizzes.filter(q => q.totalQuestions >= 5 && q.score === q.totalQuestions).length;

  // Calculate rolling quiz average %
  let baseQuizPct = 0;
  if (quizCount >= 10) {
    const totScorePct = quizzes.reduce((acc, q) => acc + (q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0), 0);
    baseQuizPct = totScorePct / quizCount;
  }

  const materials = await Material.find({ userId });
  const materialsCount = materials.length;

  // Summaries (materials with detailedNotes content)
  const summariesCount = materials.filter(m => m.detailedNotes && m.detailedNotes.length > 50).length;

  // Flashcards (total flashcards across all materials)
  let flashcardsCount = materials.reduce((acc, m) => acc + (m.flashcards?.length || 0), 0);
  // Support client manual edits if user creates them on page
  if (clientData?.flashcardCount && clientData.flashcardCount > flashcardsCount) {
    flashcardsCount = clientData.flashcardCount;
  }

  // Plans count (read client trigger)
  let plansCount = clientData?.plansCount || 0;

  // Social metrics
  const sentRequests = await FriendRequest.find({ senderId: userId });
  const friendsCount = user.friendsCount || 0;

  // Custom tracking values (read from client request or internal user values)
  const roomsJoinedCount = clientData?.roomsJoinedCount || 0;
  const roomsHostedCount = clientData?.roomsHostedCount || 0;

  // Determine values for each achievement badge
  const badgeValues: Record<string, number> = {
    // Streak
    streak_1_day: user.streak || 0,
    streak_7_days: user.streak || 0,
    streak_30_days: user.streak || 0,
    streak_90_days: user.streak || 0,
    streak_365_days: user.streak || 0,

    // Time
    time_1_hour: totalMinutes,
    time_10_hours: totalMinutes,
    time_50_hours: totalMinutes,
    time_100_hours: totalMinutes,
    time_500_hours: totalMinutes,

    // Quiz
    quiz_first: quizCount,
    quiz_perfect: perfectQuizCount,
    quiz_count_20: quizCount,
    quiz_avg_90: baseQuizPct >= 90 ? quizCount : 0, // Needs 10 quizzes & percentage >= 90
    quiz_count_50: quizCount,

    // Material
    material_5_uploads: materialsCount,
    material_20_uploads: materialsCount,
    notes_10_summaries: summariesCount,
    notes_50_flashcards: flashcardsCount,
    plans_3_created: plansCount,

    // Social
    social_3_requests: sentRequests.length,
    social_5_rooms: roomsJoinedCount,
    social_5_accepted: friendsCount,
    social_rank_1: user.globalRank === 1 ? 1 : 0,
    social_10_hosts: roomsHostedCount
  };

  const newlyUnlocked: any[] = [];

  // Go through predefined list and synchronize/evaluate progress
  for (const badge of PREDEFINED_BADGES) {
    const currentVal = Math.min(badgeValues[badge.id] || 0, badge.target);
    const isMet = currentVal >= badge.target;

    let existing = user.achievements.find((a: any) => getBadgeId(a) === badge.id);

    if (!existing) {
      existing = {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        target: badge.target,
        currentProgress: currentVal,
        isUnlocked: isMet,
        unlockedAt: isMet ? new Date().toISOString() : undefined
      };
      user.achievements.push(existing);
      stateModified = true;

      if (isMet) {
        user.aetherPoints = (user.aetherPoints || 0) + badge.points;
        newlyUnlocked.push({ ...existing, points: badge.points });
      }
    } else {
      // Update progress if not unlocked
      if (!existing.isUnlocked) {
        if (existing.currentProgress !== currentVal) {
          existing.currentProgress = currentVal;
          stateModified = true;
        }

        if (isMet) {
          existing.isUnlocked = true;
          existing.unlockedAt = new Date().toISOString();
          user.aetherPoints = (user.aetherPoints || 0) + badge.points;
          newlyUnlocked.push({ ...existing, points: badge.points });
          stateModified = true;
        }
      } else {
        // If already unlocked, ensure progress shows full target
        if (existing.currentProgress !== badge.target) {
          existing.currentProgress = badge.target;
          stateModified = true;
        }
      }
    }
  }

  if (stateModified) {
    await user.save();
  }

  return newlyUnlocked;
}

export async function getUserAchievements(userId: string) {
  const maxRetries = 5;
  let delay = 50;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getUserAchievementsInternal(userId);
    } catch (error: any) {
      if (error.name === 'VersionError' && attempt < maxRetries) {
        console.warn(`VersionError in getUserAchievements (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        console.error('Error fetching achievements after max retries:', error);
        return { achievements: [], totalPoints: 0, overallProgress: 0 };
      }
    }
  }
  return { achievements: [], totalPoints: 0, overallProgress: 0 };
}

async function getUserAchievementsInternal(userId: string) {
  const user = await User.findById(userId);
  if (!user) return { achievements: [], totalPoints: 0, overallProgress: 0 };

  if (!user.achievements || user.achievements.length === 0) {
    // Lazy auto-initialize achievements list using the retry-safe checking wrapper
    await checkAchievements(userId);
    const updatedUser = await User.findById(userId);
    if (!updatedUser) return { achievements: [], totalPoints: 0, overallProgress: 0 };
    user.achievements = updatedUser.achievements || [];
    user.aetherPoints = updatedUser.aetherPoints || 0;
  } else {
    // Sanity cleaning of any duplicate elements in-place on fetch
    const seen = new Set<string>();
    const deduped: any[] = [];
    let foundDupes = false;
    for (const ach of user.achievements) {
      const bId = getBadgeId(ach);
      if (bId && !seen.has(bId)) {
        seen.add(bId);
        deduped.push(ach);
      } else {
        foundDupes = true;
      }
    }
    if (foundDupes) {
      user.achievements = deduped;
      await user.save();
    }
  }

  const list = user.achievements.map((item: any) => {
    const bId = getBadgeId(item);
    const badge = PREDEFINED_BADGES.find(b => b.id === bId);
    return {
      id: bId,
      title: item.title,
      description: item.description,
      icon: item.icon,
      category: item.category,
      target: item.target,
      currentProgress: item.currentProgress || 0,
      isUnlocked: !!item.isUnlocked,
      unlockedAt: item.unlockedAt,
      points: badge?.points || 50
    };
  });

  const unlockedCount = list.filter(a => a.isUnlocked).length;
  const overallProgress = list.length > 0 ? Math.round((unlockedCount / list.length) * 100) : 0;

  return {
    achievements: list,
    totalPoints: user.aetherPoints || 0,
    overallProgress
  };
}
