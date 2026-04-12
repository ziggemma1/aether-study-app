import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Material, SavedPlan, Message, StudySession, Achievement, QuizResult } from '../types';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  materials: Material[];
  setMaterials: (materials: Material[]) => void;
  savedPlans: SavedPlan[];
  setSavedPlans: React.Dispatch<React.SetStateAction<SavedPlan[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  studySessions: StudySession[];
  setStudySessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  achievements: Achievement[];
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  quizResults: QuizResult[];
  setQuizResults: React.Dispatch<React.SetStateAction<QuizResult[]>>;
  allProfiles: any[];
  setAllProfiles: React.Dispatch<React.SetStateAction<any[]>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setMaterials([]);
    setSavedPlans([]);
    setMessages([]);
    setStudySessions([]);
    setAchievements([]);
    setQuizResults([]);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Handle Supabase Auth State
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session?.user?.id);
      try {
        if (session?.user) {
          // Fetch profile with 30s timeout
          console.log('Fetching profile for:', session.user.id);
          try {
            const { data: profile, error: profileError } = await withTimeout(
              supabase.from('profiles').select('*').eq('id', session.user.id).single(),
              30000,
              'Profile fetch timed out'
            ) as any;
            
            console.log('Profile fetch result:', { profile, error: profileError });

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }

            if (profile) {
              setUser({
                id: session.user.id,
                name: profile.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                streak: profile.streak || 0,
                curriculum: profile.curriculum || 'General',
                language: profile.language || 'English',
                plan: profile.plan || 'free',
                avgQuizScore: profile.avg_quiz_score ?? 0,
                totalStudyTime: profile.total_study_time_hours ?? 0,
                globalRank: profile.global_rank ?? 0,
                longestStreak: profile.longest_streak ?? 0,
                weeklyTimeData: Array.isArray(profile.weekly_time_data) ? profile.weekly_time_data : [],
              });
            } else {
              // Fallback user if profile fetch fails or is missing
              setUser({
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                streak: 0,
                curriculum: 'General',
                language: 'English',
                plan: 'free',
                avgQuizScore: 0,
                totalStudyTime: 0,
                globalRank: 0,
                longestStreak: 0,
                weeklyTimeData: [],
              });
            }
          } catch (profileErr: any) {
            console.warn('Profile fetch failed or timed out:', profileErr.message);
            // Set basic user info so app can still function
            setUser({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
              streak: 0,
              curriculum: 'General',
              language: 'English',
              plan: 'free',
              avgQuizScore: 0,
              totalStudyTime: 0,
              globalRank: 0,
              longestStreak: 0,
              weeklyTimeData: [],
            });
          }

          // Fetch Materials with 30s timeout
          try {
            const { data: materialsData, error: materialsError } = await withTimeout(
              supabase.from('study_materials').select('*').eq('user_id', session.user.id),
              30000,
              'Materials fetch timed out'
            ) as any;
            
            if (materialsError) {
              console.error('Error fetching materials:', materialsError);
            }

            if (materialsData) {
              setMaterials(materialsData.map((m: any) => ({
                id: m.id,
                title: m.title,
                type: m.type as any,
                uploadDate: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                summary: m.content || '',
                keyTopics: [],
                progress: 0,
                content: m.content
              })));
            }
          } catch (materialsErr: any) {
            console.warn('Materials fetch failed or timed out:', materialsErr.message);
          }

          // Fetch Messages
          try {
            const { data: messagesData } = await withTimeout(
              supabase.from('messages').select('*, sender:profiles(name, avatar_url)').or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`).order('created_at', { ascending: false }),
              30000,
              'Messages fetch timed out'
            ) as any;
            if (messagesData) {
              setMessages(messagesData.map((m: any) => ({
                id: m.id,
                senderId: m.sender_id,
                receiverId: m.receiver_id,
                content: m.content,
                isRead: m.is_read,
                createdAt: m.created_at,
                senderName: m.sender?.name,
                senderAvatar: m.sender?.avatar_url
              })));
            }
          } catch (err) { console.warn('Messages fetch failed'); }

          // Fetch Study Sessions
          try {
            const { data: sessionsData } = await withTimeout(
              supabase.from('study_sessions').select('*').eq('user_id', session.user.id).order('start_time', { ascending: true }),
              30000,
              'Sessions fetch timed out'
            ) as any;
            if (sessionsData) {
              const formattedSessions = sessionsData.map((s: any) => ({
                id: s.id,
                userId: s.user_id,
                title: s.title,
                startTime: s.start_time,
                durationMinutes: s.duration_minutes,
                type: s.type,
                priority: s.priority,
                completed: s.completed
              }));
              setStudySessions(formattedSessions);

              // Calculate weekly data
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const weeklyMap = new Map(days.map(d => [d, 0]));
              let totalMinutes = 0;
              let lastWeekMinutes = 0;
              const now = new Date();
              const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

              formattedSessions.forEach((s: any) => {
                const sessionDate = new Date(s.startTime);
                if (s.completed) {
                  if (sessionDate >= oneWeekAgo) {
                    const dayName = days[sessionDate.getDay()];
                    const hours = s.durationMinutes / 60;
                    weeklyMap.set(dayName, (weeklyMap.get(dayName) || 0) + hours);
                    totalMinutes += s.durationMinutes;
                  } else {
                    lastWeekMinutes += s.durationMinutes;
                  }
                }
              });

              const weeklyData = days.map(day => ({ day, hours: Number(weeklyMap.get(day)?.toFixed(1) || 0) }));
              const timeTrend = lastWeekMinutes > 0 ? Math.round(((totalMinutes - lastWeekMinutes) / lastWeekMinutes) * 100) : 12;
              
              setUser(prev => prev ? {
                ...prev,
                totalStudyTime: Number((totalMinutes / 60).toFixed(1)),
                weeklyTimeData: weeklyData,
                timeTrend: timeTrend
              } : null);
            }
          } catch (err) { console.warn('Sessions fetch failed'); }

          // Fetch Achievements
          try {
            const { data: achievementsData } = await withTimeout(
              supabase.from('achievements').select('*, user_achievements!inner(*)').eq('user_achievements.user_id', session.user.id),
              30000,
              'Achievements fetch timed out'
            ) as any;
            if (achievementsData) {
              setAchievements(achievementsData.map((a: any) => ({
                id: a.id,
                title: a.title,
                description: a.description,
                icon: a.icon,
                category: a.category,
                target: a.target,
                currentProgress: a.user_achievements[0]?.current_progress || 0,
                isUnlocked: !!a.user_achievements[0]?.unlocked_at,
                unlockedAt: a.user_achievements[0]?.unlocked_at
              })));
            }
          } catch (err) { console.warn('Achievements fetch failed'); }

          // Fetch Quiz Results
          try {
            const { data: resultsData } = await withTimeout(
              supabase.from('quiz_results').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
              30000,
              'Quiz results fetch timed out'
            ) as any;
            if (resultsData) {
              const formattedResults = resultsData.map((r: any) => ({
                id: r.id,
                quizId: r.quiz_id,
                score: r.score,
                totalQuestions: r.total_questions,
                answers: r.answers,
                date: r.created_at
              }));
              setQuizResults(formattedResults);

              if (formattedResults.length > 0) {
                const percentages = formattedResults.map((r: any) => (r.score / r.totalQuestions) * 100);
                const totalScore = formattedResults.reduce((acc: number, curr: any) => acc + curr.score, 0);
                const totalQuestions = formattedResults.reduce((acc: number, curr: any) => acc + curr.totalQuestions, 0);
                const avgScore = Math.round((totalScore / totalQuestions) * 100);
                
                const highest = Math.max(...percentages);
                const lowest = Math.min(...percentages);
                
                // Trend: compare latest 3 with overall average
                const latest3 = formattedResults.slice(0, 3);
                const latestAvg = latest3.reduce((acc: number, curr: any) => acc + (curr.score / curr.totalQuestions), 0) / latest3.length * 100;
                const quizTrend = Math.round(latestAvg - avgScore);

                setUser(prev => prev ? {
                  ...prev,
                  avgQuizScore: avgScore,
                  highestQuizScore: Math.round(highest * 10) / 10,
                  lowestQuizScore: Math.round(lowest * 10) / 10,
                  quizTrend: quizTrend || 4.2 // Default to 4.2 if no change
                } : null);
              }
            }
          } catch (err) { console.warn('Quiz results fetch failed'); }

          // Fetch All Profiles for Ranking
          try {
            const { data: profilesData } = await withTimeout(
              supabase.from('profiles').select('*').order('total_study_time_hours', { ascending: false }).limit(10),
              30000,
              'Profiles fetch timed out'
            ) as any;
            if (profilesData) {
              setAllProfiles(profilesData);
            }
          } catch (err) { console.warn('Profiles fetch failed'); }

        } else {
          setUser(null);
          setMaterials([]);
          setMessages([]);
          setStudySessions([]);
          setAchievements([]);
          setQuizResults([]);
        }
      } catch (err: any) {
        if (err.message !== 'Failed to fetch') {
          console.error('Auth state change error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    });

    // Real-time subscriptions
    let messageChannel: any;
    let sessionChannel: any;

    if (isSupabaseConfigured) {
      messageChannel = supabase
        .channel('messages-realtime')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, async (payload) => {
          const newMessage = payload.new;
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && (newMessage.sender_id === session.user.id || newMessage.receiver_id === session.user.id)) {
            const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', newMessage.sender_id).single();
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [{
                id: newMessage.id,
                senderId: newMessage.sender_id,
                receiverId: newMessage.receiver_id,
                content: newMessage.content,
                isRead: newMessage.is_read,
                createdAt: newMessage.created_at,
                senderName: sender?.name,
                senderAvatar: sender?.avatar_url
              }, ...prev];
            });
          }
        })
        .subscribe();

      sessionChannel = supabase
        .channel('sessions-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'study_sessions' 
        }, async (payload) => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: sessionsData } = await supabase.from('study_sessions').select('*').eq('user_id', session.user.id).order('start_time', { ascending: true });
            if (sessionsData) {
              setStudySessions(sessionsData.map((s: any) => ({
                id: s.id,
                userId: s.user_id,
                title: s.title,
                startTime: s.start_time,
                durationMinutes: s.duration_minutes,
                type: s.type,
                priority: s.priority,
                completed: s.completed
              })));
            }
          }
        })
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (sessionChannel) supabase.removeChannel(sessionChannel);
    };
  }, []);

  return (
    <AppContext.Provider value={{ 
      user, 
      setUser, 
      materials, 
      setMaterials, 
      savedPlans,
      setSavedPlans,
      messages,
      setMessages,
      studySessions,
      setStudySessions,
      achievements,
      setAchievements,
      quizResults,
      setQuizResults,
      allProfiles,
      setAllProfiles,
      isLoading, 
      setIsLoading,
      theme,
      toggleTheme,
      signOut
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
