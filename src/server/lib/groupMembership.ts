/**
 * Is this user in this group?
 *
 * `Group.members` is `[ObjectId]` and the userId taken off the JWT (or a
 * request body) is a string, so the bare `group.members.includes(userId)` that
 * guarded every group operation was **always false**. Group chat rejected every
 * message with "You are not a member of this group", including for the person
 * who created the group; `addMember` had the inverse problem and would push the
 * same member in again on each call.
 */
export function isGroupMember(group: any, userId: any): boolean {
  if (!group || !userId) return false;
  const target = String(userId);
  return (group.members || []).some((m: any) => String(m) === target);
}
