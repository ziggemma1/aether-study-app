/**
 * Demo/marketing-recording data seeder.
 *
 * Populates a local dev database with realistic-looking data so the app can
 * be screen-recorded without looking empty — a fully separate, clearly-
 * isolated path from the real app flow. Nothing here fabricates data inside
 * a real user's account: everything it writes is tagged `isDemoData: true`
 * (see the field added to User/Material/StudySession/QuizResult/Room) so it
 * can be found and removed precisely, and it refuses to run at all against
 * a production environment.
 *
 * Usage:
 *   npm run seed:demo         — wipe any previous demo data, seed fresh
 *   npm run seed:demo:reset   — wipe demo data only, seed nothing
 *
 * Design notes (the "why", for future edits):
 * - Direct Mongoose writes, not HTTP calls through the running server — the
 *   goal is real documents read by the real API/controllers and rendered by
 *   the real React components, not a mockup. A seed script reaching the DB
 *   directly gets there in ~2s instead of dozens of authenticated round
 *   trips, with no server needing to be up first.
 * - Achievement progress is computed by importing and calling the app's own
 *   `checkAchievements()` against the seeded sessions/quizzes/materials,
 *   rather than hand-picking which badges look unlocked. That keeps every
 *   badge's progress consistent with the underlying seeded activity, so it
 *   won't visibly "snap" to a different number the moment the demo account
 *   does anything real during a recording.
 * - Live Room occupancy is DB-backed (Room.activeCount/participants are real
 *   persisted fields — see src/server/socket.ts's broadcastRoomParticipants),
 *   so it can be seeded with zero socket connections. The one thing this
 *   can't fix: that same DB state is a *cache* the real socket layer
 *   overwrites the moment anyone actually joins/leaves a seeded room. If a
 *   room's occupancy looks wrong before a take, just rerun `npm run
 *   seed:demo` — it's cheap and fully idempotent.
 */

import dns from 'dns';
// Same workaround server.ts uses: this environment's default DNS resolver
// doesn't reliably answer the SRV lookups `mongodb+srv://` needs.
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crypto from 'node:crypto';

import { User } from '../src/server/models/User.js';
import { Material } from '../src/server/models/Material.js';
import { StudySession } from '../src/server/models/StudySession.js';
import { QuizResult } from '../src/server/models/QuizResult.js';
import Room from '../src/server/models/Room.js';
import { checkAchievements } from '../src/server/services/achievement-service.js';
import { DEMO_MATERIALS, DEMO_COMMUNITY_EXTRAS, DEMO_PEOPLE } from './demoContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ---------------------------------------------------------------------------
// Safety gate. This must never run against a real deploy. NODE_ENV isn't
// normally set for a local `tsx scripts/seedDemo.ts` invocation, but this is
// defense in depth in case the script is ever wired into a hosted job.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ Refusing to run: NODE_ENV is "production". Demo seeding is local/dev only.\n');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is not set (check your .env). Nothing was touched.\n');
  process.exit(1);
}

const DEMO_EMAIL = 'demo@aetherstudy.local';
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_NAME = 'Jordan Ellis';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** A UTC timestamp `daysBack` days ago, at a given UTC hour. */
function daysAgoAt(daysBack: number, hour = 12): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function daysAheadAt(daysAhead: number, hour = 12): Date {
  return daysAgoAt(-daysAhead, hour);
}

/** Monday 00:00 UTC of the current week — matches leaderboardRoutes.ts's own reckoning. */
function startOfWeekUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
}

function avatarFor(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function randomPassword(): string {
  return crypto.randomBytes(24).toString('hex'); // never used to log in — just satisfies the required field
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Teardown — the "OFF" side of the toggle. Deletes only isDemoData docs.
// ---------------------------------------------------------------------------
async function teardown(): Promise<void> {
  const [u, m, s, q, r] = await Promise.all([
    User.deleteMany({ isDemoData: true }),
    Material.deleteMany({ isDemoData: true }),
    StudySession.deleteMany({ isDemoData: true }),
    QuizResult.deleteMany({ isDemoData: true }),
    Room.deleteMany({ isDemoData: true })
  ]);
  console.log(
    `🧹 Removed demo data — users: ${u.deletedCount}, materials: ${m.deletedCount}, ` +
    `sessions: ${s.deletedCount}, quiz results: ${q.deletedCount}, rooms: ${r.deletedCount}.`
  );
}

// ---------------------------------------------------------------------------
// The account you actually log into for recording.
// ---------------------------------------------------------------------------
async function seedDemoUser() {
  const demoUser = new User({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    handle: 'jordanellis',
    avatar: avatarFor(DEMO_NAME),
    bio: 'Prepping for finals and trying to keep the streak alive.',
    curriculum: 'Computer Science',
    country: 'USA',
    language: 'English (US)',
    onboardingCompletedAt: new Date(), // skip the first-run flow entirely
    optedInLeaderboard: true,
    // Streak: set directly rather than replayed through touchStreak (there's
    // no practical way to simulate N real days in one script run). Kept to
    // the field set streak-service.ts documents as safe: streak/longestStreak
    // plus lastActiveDate pinned to *yesterday* — not today, so the very next
    // real study action during a recording correctly extends it to 19
    // instead of being a same-day no-op, and not further back, so it doesn't
    // risk a reset.
    streak: 18,
    longestStreak: 26,
    lastActiveDate: daysAgoAt(1, 14),
    freezeTokens: 2,
    equippedTheme: '', // themes untouched — default violet accent
    equippedVoice: 'Kore',
    isDemoData: true
  });
  await demoUser.save();
  console.log(`👤 Demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return demoUser;
}

// ---------------------------------------------------------------------------
// Study sessions + quiz results — the underlying activity that the
// dashboard, weekly chart, streak-consistency, and achievements all read
// from. Everything downstream is derived from this, not hand-set.
// ---------------------------------------------------------------------------
async function seedDemoUserActivity(demoUserId: mongoose.Types.ObjectId) {
  const materialTitles = DEMO_MATERIALS.map((m) => m.title);
  const sessions: any[] = [];
  let totalStudyMinutes = 0;

  // Spread across the last ~6 weeks so the library/dashboard look lived-in,
  // not created in the same second.
  for (let i = 0; i < 24; i++) {
    const daysBack = randomInt(1, 42);
    const duration = pick([20, 25, 30, 35, 40, 45, 50, 60, 75, 90]);
    sessions.push({
      userId: demoUserId,
      title: `Study: ${materialTitles[i % materialTitles.length]}`,
      startTime: daysAgoAt(daysBack, randomInt(7, 21)),
      durationMinutes: duration,
      type: 'study',
      completed: true,
      isDemoData: true
    });
    totalStudyMinutes += duration;
  }

  // A handful explicitly inside the current UTC week, so the weekly chart
  // and the "This Week" leaderboard tab aren't empty.
  const weekStart = startOfWeekUTC();
  for (let i = 0; i < 4; i++) {
    const start = new Date(weekStart);
    start.setUTCDate(start.getUTCDate() + i);
    start.setUTCHours(9 + i * 2, 0, 0, 0);
    if (start > new Date()) continue; // never schedule a future session as "completed"
    const duration = 30 + i * 10;
    sessions.push({
      userId: demoUserId,
      title: `Study: ${materialTitles[i]}`,
      startTime: start,
      durationMinutes: duration,
      type: 'study',
      completed: true,
      isDemoData: true
    });
    totalStudyMinutes += duration;
  }

  // One real upcoming (not-yet-completed) session — this is what the
  // Dashboard's "coming up" card reads (see Dashboard.tsx: it filters
  // studySessions by future startTime; there's no separate "planned
  // session" model).
  sessions.push({
    userId: demoUserId,
    title: `Study: ${materialTitles[0]}`,
    startTime: daysAheadAt(1, 17),
    durationMinutes: 45,
    type: 'study',
    completed: false,
    isDemoData: true
  });

  await StudySession.insertMany(sessions);

  // Quiz results: mostly solid scores with real spread, one perfect run.
  const quizzes: any[] = [];
  let quizPctSum = 0;
  for (let i = 0; i < 10; i++) {
    const totalQuestions = pick([5, 8, 10, 10, 12]);
    const ratio = i === 0 ? 1 : 0.6 + Math.random() * 0.4;
    const score = Math.min(totalQuestions, Math.round(totalQuestions * ratio));
    quizzes.push({
      userId: demoUserId,
      quizId: `demo-quiz-${i}`,
      score,
      totalQuestions,
      answers: Array.from({ length: totalQuestions }, () => 0),
      createdAt: daysAgoAt(randomInt(1, 40), randomInt(8, 20)),
      isDemoData: true
    });
    quizPctSum += (score / totalQuestions) * 100;
  }
  await QuizResult.insertMany(quizzes);

  const avgQuizScore = Math.round(quizPctSum / quizzes.length);
  const pctList = quizzes.map((q) => (q.score / q.totalQuestions) * 100);

  // Fallback-path fields on the user doc (dashboardRoutes prefers the live
  // aggregation above these, but Profile/Plans/Reports fall back to them
  // when there are zero sessions — keep them consistent regardless).
  await User.updateOne(
    { _id: demoUserId },
    {
      $set: {
        totalStudyTime: totalStudyMinutes,
        avgQuizScore,
        highestQuizScore: Math.round(Math.max(...pctList)),
        lowestQuizScore: Math.round(Math.min(...pctList)),
        aetherPoints: 2200 // base, pre-achievement-bonus — competitors below are placed around the FINAL value
      }
    }
  );

  console.log(`📊 Seeded ${sessions.length} study sessions and ${quizzes.length} quiz results (${totalStudyMinutes} min total).`);
}

// ---------------------------------------------------------------------------
// Library materials — the demo account's own, varied across 8 subjects.
// ---------------------------------------------------------------------------
async function seedDemoUserMaterials(demoUser: any) {
  const docs = DEMO_MATERIALS.map((spec) => ({
    userId: demoUser._id,
    title: spec.title,
    type: spec.type,
    summary: spec.summary,
    content: spec.detailedNotes,
    keyTopics: spec.keyTopics,
    suggestedQuizQuestions: spec.quizQuestions,
    flashcards: spec.flashcards.map((f) => ({
      question: f.question,
      answer: f.answer,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date(),
      masteryLevel: spec.progress
    })),
    detailedNotes: spec.detailedNotes,
    progress: spec.progress,
    isPublic: !!spec.isPublic,
    // Own library items stay credited to the demo account itself — no
    // borrowed identities here; see seedCommunityExtras for the separately-
    // authored posts that give the community feed real variety.
    authorName: spec.isPublic ? demoUser.name : undefined,
    category: spec.category,
    likes: spec.isPublic ? randomInt(5, 90) : 0,
    downloads: spec.isPublic ? randomInt(0, 45) : 0,
    rating: spec.isPublic ? Math.round((3.5 + Math.random() * 1.5) * 10) / 10 : 0,
    createdAt: daysAgoAt(spec.daysAgo, 10),
    isDemoData: true
  }));

  await Material.insertMany(docs);
  console.log(`📚 Seeded ${docs.length} library materials across ${new Set(DEMO_MATERIALS.map((m) => m.category)).size} subjects (${docs.filter((d) => d.isPublic).length} public).`);
}

// ---------------------------------------------------------------------------
// Achievements — computed for real from the data just seeded, not hand-set.
// ---------------------------------------------------------------------------
async function runAchievements(demoUserId: mongoose.Types.ObjectId): Promise<number> {
  await checkAchievements(String(demoUserId));
  const updated = await User.findById(demoUserId).select('aetherPoints achievements');
  const unlockedCount = (updated?.achievements || []).filter((a: any) => a.isUnlocked).length;
  const total = (updated?.achievements || []).length;
  console.log(`🏆 Achievements evaluated from real seeded activity: ${unlockedCount}/${total} unlocked.`);
  return updated?.aetherPoints || 2200;
}

// ---------------------------------------------------------------------------
// Leaderboard competitors. Point totals are placed around the demo
// account's FINAL (post-achievement) score so it lands mid-pack, not #1 of
// a near-empty board.
// ---------------------------------------------------------------------------
const COMPETITOR_POINTS = [5400, 4800, 4200, 3900, 3600, 3400, 3100, 2700, 2500, 2200, 1900, 1600, 1300, 950, 600, 300];

async function seedCompetitors() {
  const docs = DEMO_PEOPLE.map((person, i) => ({
    name: person.name,
    email: `${person.handle}.demo@aetherstudy.local`,
    password: randomPassword(),
    handle: `${person.handle}_demo`,
    avatar: avatarFor(person.name),
    onboardingCompletedAt: daysAgoAt(randomInt(20, 120)),
    optedInLeaderboard: true,
    aetherPoints: COMPETITOR_POINTS[i] ?? randomInt(300, 2000),
    streak: randomInt(0, 45),
    longestStreak: randomInt(5, 60),
    totalStudyTime: randomInt(200, 9000),
    isDemoData: true
  }));

  const created = await User.create(docs);
  console.log(`🏅 Seeded ${created.length} leaderboard competitors.`);
  return created;
}

/** A few current-week sessions/quizzes for a subset of competitors, so the
 *  "This Week" leaderboard tab isn't a ghost town next to a populated
 *  all-time tab. */
async function seedCompetitorWeeklyActivity(competitors: any[]) {
  const weekStart = startOfWeekUTC();
  const chosen = [0, 1, 2, 4, 6, 8].map((i) => competitors[i]).filter(Boolean);

  const sessions: any[] = [];
  const quizzes: any[] = [];
  for (const person of chosen) {
    const sessionCount = randomInt(1, 2);
    for (let i = 0; i < sessionCount; i++) {
      const start = new Date(weekStart);
      start.setUTCDate(start.getUTCDate() + randomInt(0, Math.min(6, new Date().getUTCDay() === 0 ? 6 : new Date().getUTCDay() - 1)));
      start.setUTCHours(randomInt(8, 20), 0, 0, 0);
      if (start > new Date()) continue;
      sessions.push({
        userId: person._id,
        title: 'Study session',
        startTime: start,
        durationMinutes: pick([20, 30, 45, 60]),
        type: 'study',
        completed: true,
        isDemoData: true
      });
    }
    if (Math.random() > 0.4) {
      const totalQuestions = pick([5, 10]);
      quizzes.push({
        userId: person._id,
        quizId: 'demo-weekly-quiz',
        score: randomInt(Math.round(totalQuestions * 0.5), totalQuestions),
        totalQuestions,
        answers: Array.from({ length: totalQuestions }, () => 0),
        createdAt: daysAgoAt(randomInt(0, 3)),
        isDemoData: true
      });
    }
  }

  if (sessions.length) await StudySession.insertMany(sessions);
  if (quizzes.length) await QuizResult.insertMany(quizzes);
  console.log(`📅 Gave ${chosen.length} competitors this-week activity (${sessions.length} sessions, ${quizzes.length} quizzes) for the weekly leaderboard tab.`);
}

// ---------------------------------------------------------------------------
// Community/Explore variety — separate posts, each credited to (and owned
// by) the person who "wrote" it. No name/owner mismatch.
// ---------------------------------------------------------------------------
async function seedCommunityExtras(competitors: any[]) {
  const docs = DEMO_COMMUNITY_EXTRAS.map((spec) => {
    const owner = competitors[spec.ownerIndex] || competitors[0];
    return {
      userId: owner._id,
      title: spec.title,
      type: spec.type,
      summary: spec.summary,
      content: spec.detailedNotes,
      keyTopics: spec.keyTopics,
      suggestedQuizQuestions: spec.quizQuestions,
      flashcards: spec.flashcards.map((f) => ({
        question: f.question,
        answer: f.answer,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date(),
        masteryLevel: 0
      })),
      detailedNotes: spec.detailedNotes,
      progress: 0, // this account never studied it — it's their upload, not their own material
      isPublic: true,
      authorName: owner.name,
      category: spec.category,
      likes: randomInt(3, 60),
      downloads: randomInt(0, 30),
      rating: Math.round((3.2 + Math.random() * 1.8) * 10) / 10,
      createdAt: daysAgoAt(spec.daysAgo, 11),
      isDemoData: true
    };
  });

  await Material.insertMany(docs);
  console.log(`🌐 Seeded ${docs.length} community posts from ${new Set(docs.map((d) => d.authorName)).size} different authors.`);
}

// ---------------------------------------------------------------------------
// Live Rooms — occupancy written straight to the DB fields the real
// GET /rooms read path already serves (see Room.activeCount/participants).
// A mix of active (green/pulsing) and quiet rooms, per the brief.
// ---------------------------------------------------------------------------
async function seedRooms(competitors: any[]) {
  const idOf = (i: number) => competitors[i]?._id;

  const rooms = [
    { name: 'Calculus Study Group', topic: 'Calculus', participantIdx: [0, 2, 5, 9] },
    { name: 'Late Night Cram Session', topic: 'General', participantIdx: [3, 7] },
    { name: 'MCAT Prep Squad', topic: 'Biology', participantIdx: [1, 4, 6, 10, 12] },
    { name: 'Morning Focus Hour', topic: 'General', participantIdx: [8, 11, 14] },
    { name: 'Quiet Reading Room', topic: 'Literature', participantIdx: [] },
    { name: 'Spanish Practice Circle', topic: 'Spanish', participantIdx: [] }
  ].map((r) => {
    const participants = r.participantIdx.map(idOf).filter(Boolean);
    return {
      name: r.name,
      topic: r.topic,
      activeCount: participants.length,
      participants,
      isPublic: true,
      isDemoData: true
    };
  });

  await Room.insertMany(rooms);
  const active = rooms.filter((r) => r.activeCount > 0).length;
  console.log(`🎙️  Seeded ${rooms.length} live rooms (${active} active, ${rooms.length - active} quiet).`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const isResetOnly = process.argv.includes('--reset');

  console.log(`\nConnecting to ${maskUri(MONGODB_URI!)} …`);
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.\n');

  await teardown();

  if (isResetOnly) {
    console.log('\n✅ Demo mode is OFF. Database is back to its real state.\n');
    await mongoose.disconnect();
    return;
  }

  const demoUser = await seedDemoUser();
  await seedDemoUserActivity(demoUser._id);
  await seedDemoUserMaterials(demoUser);
  const finalPoints = await runAchievements(demoUser._id);

  const competitors = await seedCompetitors();
  await seedCompetitorWeeklyActivity(competitors);
  await seedCommunityExtras(competitors);
  await seedRooms(competitors);

  const rank = 1 + COMPETITOR_POINTS.filter((p) => p > finalPoints).length;
  console.log(
    `\n✅ Demo mode is ON.\n` +
    `   Log in at ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n` +
    `   Final aetherPoints: ${finalPoints} — landing around rank ${rank} of ${competitors.length + 1} on the all-time leaderboard.\n` +
    `   Run "npm run seed:demo:reset" when you're done recording to remove all of it.\n`
  );

  await mongoose.disconnect();
}

function maskUri(uri: string): string {
  try {
    const withoutCreds = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    return withoutCreds.split('?')[0];
  } catch {
    return '(uri)';
  }
}

main().catch((err) => {
  console.error('\n❌ Demo seeding failed:', err);
  process.exitCode = 1;
});
