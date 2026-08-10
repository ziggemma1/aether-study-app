/**
 * Fake room occupants + chat, for recording Live Rooms marketing footage
 * without depending on a second real person and a working socket connection.
 *
 * Gated entirely on `user.isDemoData` (see useLiveRoom.ts) — the seeded
 * marketing account from scripts/seedDemo.ts is the only account this can
 * ever be true for, so this is inert dead code for every real user and never
 * touches the real socket/presence system or the database. Kept as a small,
 * client-only, self-contained list rather than importing
 * scripts/demoContent.ts, which is a Node-only seeding script (not meant for
 * the browser bundle) with ~16 full materials' worth of content behind the
 * same export.
 */

export interface DemoParticipantSeed {
  id: string;
  name: string;
  focusStatus: 'focusing' | 'break';
}

// Same "cast" flavour as scripts/demoContent.ts's DEMO_PEOPLE, so a viewer
// who's seen the leaderboard/community pages doesn't get a jarring new set
// of strangers inside the room — deliberately not the identical list/order.
export const DEMO_ROOM_PARTICIPANTS: DemoParticipantSeed[] = [
  { id: 'demo-1', name: 'Priya Kapoor', focusStatus: 'focusing' },
  { id: 'demo-2', name: 'Marcus Chen', focusStatus: 'focusing' },
  { id: 'demo-3', name: 'Sofia Reyes', focusStatus: 'break' },
  { id: 'demo-4', name: 'Kwame Mensah', focusStatus: 'focusing' },
  { id: 'demo-5', name: 'Yuki Tanaka', focusStatus: 'break' }
];

export interface DemoMessageSeed {
  /** Minutes before "now" this message was sent — oldest first. */
  minutesAgo: number;
  senderId: string;
  senderName: string;
  content: string;
}

export const DEMO_ROOM_MESSAGES: DemoMessageSeed[] = [
  { minutesAgo: 14, senderId: 'demo-1', senderName: 'Priya Kapoor', content: 'starting a round, who\'s in?' },
  { minutesAgo: 13, senderId: 'demo-2', senderName: 'Marcus Chen', content: 'in — grinding through flashcards' },
  { minutesAgo: 9, senderId: 'demo-4', senderName: 'Kwame Mensah', content: 'this room has the best energy lol' },
  { minutesAgo: 6, senderId: 'demo-3', senderName: 'Sofia Reyes', content: 'back in 5, grabbing coffee ☕' },
  { minutesAgo: 2, senderId: 'demo-5', senderName: 'Yuki Tanaka', content: 'anyone have a good mnemonic for this? my notes are a mess' }
];
