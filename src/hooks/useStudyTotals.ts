import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * One place that answers "how much has this person studied?".
 *
 * There were two answers on screen at once: the Profile header read
 * `user.totalStudyTime` (3h 13m) while the Plans page summed the session
 * records (8h 10m). They drift because `totalStudyTime` is a running counter
 * that `createSession` only increments for `type === 'study'` — anything logged
 * another way, or before that branch existed, never reached it.
 *
 * The session records are the evidence, so they win. The stored counter is the
 * fallback for the moment before `/sessions` has loaded, so the number does not
 * flash 0 on arrival.
 */
export function useStudyTotals() {
  const { user, studySessions, quizResults, materials } = useAppContext();

  return useMemo(() => {
    const sessions = studySessions || [];
    const loggedMinutes = sessions.reduce((sum, s: any) => sum + (s.durationMinutes || 0), 0);

    return {
      minutes: sessions.length > 0 ? loggedMinutes : (user?.totalStudyTime || 0),
      sessions: sessions.length,
      quizzes: quizResults?.length || 0,
      materials: materials.length
    };
  }, [user, studySessions, quizResults, materials]);
}
