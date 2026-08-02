import { Notification } from '../models/Notification.js';

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'achievement'
  | 'nudge'
  | 'streak_milestone'
  | 'quiz_complete'
  | 'general';

/**
 * Records a notification for a user.
 *
 * Every call site is a side effect of some other action the user actually
 * cared about (saving a session, accepting a friend request). A failure to
 * write the notification must never fail that action, so errors are logged
 * and swallowed rather than propagated.
 */
export async function createNotification(
  userId: string,
  message: string,
  type: NotificationType = 'general'
): Promise<void> {
  try {
    await Notification.create({ userId, message, type, read: false });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Bulk variant for when a single event produces several notifications for the
 * same user — e.g. one study session tipping over two badges at once.
 */
export async function createNotifications(
  userId: string,
  entries: { message: string; type?: NotificationType }[]
): Promise<void> {
  if (!entries.length) return;
  try {
    await Notification.insertMany(
      entries.map(e => ({ userId, message: e.message, type: e.type || 'general', read: false }))
    );
  } catch (error) {
    console.error('Failed to create notifications:', error);
  }
}
