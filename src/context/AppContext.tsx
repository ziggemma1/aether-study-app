import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Material, SavedPlan, Message, StudySession, Achievement, QuizResult } from '../types';
import api from '../services/api';

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
  dbError: string | null;
  setDbError: (error: string | null) => void;
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
  const [dbError, setDbError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
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

  useEffect(() => {
    const handleDbError = (e: any) => {
      setDbError(e.detail?.message || 'Database connection error');
    };
    window.addEventListener('app:db-error', handleDbError);
    return () => window.removeEventListener('app:db-error', handleDbError);
  }, []);

  // Auto-retry polling when DB error exists
  useEffect(() => {
    if (!dbError) return;

    console.log('🔄 DB Error detected, starting auto-retry poll...');
    let pollInterval: any;

    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        if (response.data.dbConnected) {
          console.log('✅ DB is back online! Clearing error...');
          setDbError(null);
          // Reload current data
          window.location.reload();
        }
      } catch (err) {
        console.warn('Polling health check failed, still disconnected.');
      }
    };

    pollInterval = setInterval(checkHealth, 3000); // Check every 3 seconds

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [dbError]);

  // Check auth on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        return true;
      } catch (err: any) {
        console.log('Not authenticated or error checking auth');
        // Only clear user on explicit 401
        if (err.response?.status === 401) {
          setUser(null);
        }
        return false;
      }
    };

    const fetchAppData = async () => {
      const endpoints = [
        { key: 'materials', url: '/materials', setter: setMaterials },
        { key: 'sessions', url: '/sessions', setter: setStudySessions },
        { key: 'quizzes', url: '/quizzes', setter: setQuizResults },
        { key: 'messages', url: '/messages', setter: setMessages },
        { key: 'profiles', url: '/users/profiles', setter: setAllProfiles }
      ];

      const mapId = (item: any) => ({ 
        ...item, 
        id: item._id || item.id,
        uploadDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'
      });

      // Fetch each independently to prevent one failure from blocking others
      await Promise.all(endpoints.map(async ({ url, setter }) => {
        try {
          const res = await api.get(url);
          if (Array.isArray(res.data)) {
            setter(res.data.map(mapId));
          }
        } catch (err) {
          console.warn(`Failed to fetch ${url}:`, err);
        }
      }));
    };

    const initialize = async () => {
      setIsLoading(true);
      const isAuthed = await fetchUserData();
      if (isAuthed) {
        await fetchAppData();
      }
      setIsLoading(false);
    };

    initialize();
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
      dbError,
      setDbError,
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
