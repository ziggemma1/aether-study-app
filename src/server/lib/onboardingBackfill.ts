import { User } from '../models/User.js';

/**
 * Accounts created before first-run onboarding shipped have no
 * `onboardingCompletedAt` path on their document at all. The client routes any
 * user without a completion date into /onboarding, so without this every
 * existing account would be dragged through the new-user flow on next login.
 *
 * Idempotent by construction: it matches only documents where the field is
 * absent, so it is a no-op on every boot after the first. New signups get
 * `null` written explicitly by the schema default, so they never match here.
 */
export async function backfillOnboarding() {
  try {
    const result = await User.updateMany(
      { onboardingCompletedAt: { $exists: false } },
      { $set: { onboardingCompletedAt: new Date() } }
    );
    if (result.modifiedCount) {
      console.log(`[Migration] Marked ${result.modifiedCount} pre-existing account(s) as already onboarded`);
    }
  } catch (err: any) {
    // Never fatal — a failed backfill shows existing users an extra skippable
    // screen, which is not worth refusing to boot over.
    console.error('[Migration] Onboarding backfill failed:', err?.message);
  }
}
