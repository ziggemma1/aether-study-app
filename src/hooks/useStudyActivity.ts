import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDashboardData, RecentMaterial } from './useDashboardData';

export interface StudyActivityItem {
  id: string;
  name: string;
  type: 'session' | 'upload' | 'score' | 'streak';
  score?: number;
  duration?: number;
  dateStr?: string;
}

export function useStudyActivity() {
  const { studySessions, quizResults } = useAppContext();
  const { user, recentMaterials } = useDashboardData();

  return useMemo(() => {
    const activities: StudyActivityItem[] = [];

    // 1. Process recent study materials uploads
    if (Array.isArray(recentMaterials)) {
      recentMaterials.slice(0, 10).forEach((mat: RecentMaterial) => {
        activities.push({
          id: `upload-${mat.id}`,
          name: mat.title,
          type: 'upload',
          dateStr: mat.uploadDate,
        });
      });
    }

    // 2. Process study session times
    if (Array.isArray(studySessions)) {
      studySessions.slice(0, 10).forEach((sess) => {
        if (sess && sess.id) {
          activities.push({
            id: `session-${sess.id}`,
            name: sess.title || 'Study Session',
            type: 'session',
            duration: sess.durationMinutes || 0,
            dateStr: sess.startTime,
          });
        }
      });
    }

    // 3. Process quiz score metrics
    if (Array.isArray(quizResults)) {
      quizResults.slice(0, 8).forEach((q) => {
        if (q && q.id) {
          activities.push({
            id: `quiz-${q.id}`,
            name: `Quiz Result (${q.score}/${q.totalQuestions || 10})`,
            type: 'score',
            score: q.score || 0,
            dateStr: q.date,
          });
        }
      });
    }

    // 4. Inject streak milestones directly as central navigation anchors
    if (user && user.streak > 0) {
      activities.push({
        id: 'streak-anchor',
        name: `${user.streak} Day HeatStreak!`,
        type: 'streak',
        score: user.streak,
        dateStr: new Date().toISOString()
      });
    }

    return activities;
  }, [recentMaterials, studySessions, quizResults, user]);
}
