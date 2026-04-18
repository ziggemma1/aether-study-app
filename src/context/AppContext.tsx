import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Material, SavedPlan, Message, StudySession, Achievement, QuizResult } from '../types';
import api from '../services/api';
import { translations, Language } from '../lib/translations';

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
  showToast: (text: string, type?: 'success' | 'error') => void;
  toast: { text: string, type: 'success' | 'error' } | null;
  t: (key: string) => string;
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
  const [toast, setToast] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    const lang = (user?.language as Language) || 'English (US)';
    const langGroup = translations[lang] || translations['English (US)'];
    return langGroup[key] || translations['English (US)'][key] || key;
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
    localStorage.removeItem('user');
    localStorage.removeItem('cached_materials');
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

  const fetchUserData = React.useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return true;
      }
      return false;
    } catch (err: any) {
      console.log('Not authenticated or error checking auth');
      // Only clear user on definitive 401 Unauthorized
      if (err.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('user');
      }
      return false;
    }
  }, []);

  const fetchAppData = React.useCallback(async () => {
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

    try {
      await Promise.all(endpoints.map(async ({ url, setter }) => {
        try {
          const res = await api.get(url);
          if (Array.isArray(res.data)) {
            const mapped = res.data.map(mapId);
            setter(mapped);
            // Persistent cache for materials to prevent flicker
            if (url === '/materials') {
              localStorage.setItem('cached_materials', JSON.stringify(mapped));
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch ${url}:`, err);
        }
      }));
    } catch (err) {
      console.error('Fetch App Data error:', err);
    }
  }, []);

  const initialize = React.useCallback(async () => {
    // Try to load from cache first for immediate UI responsiveness
    const cachedUser = localStorage.getItem('user');
    const cachedMaterials = localStorage.getItem('cached_materials');
    
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    
    if (cachedMaterials) {
      try {
        setMaterials(JSON.parse(cachedMaterials));
      } catch (e) {
        localStorage.removeItem('cached_materials');
      }
    }

    setIsLoading(true);
    const isAuthed = await fetchUserData();
    if (isAuthed) {
      await fetchAppData();
    } else if (!localStorage.getItem('user')) {
      // If we are definitely not authed and have no cache, clear state
      setMaterials([]);
    }
    setIsLoading(false);
  }, [fetchUserData, fetchAppData]);

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
          // Gently refresh app state instead of a hard reload
          initialize();
        }
      } catch (err) {
        console.warn('Polling health check failed, still disconnected.');
      }
    };

    pollInterval = setInterval(checkHealth, 3000); // Check every 3 seconds

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [dbError, initialize]);

  // Check auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

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
      signOut,
      showToast,
      toast,
      t
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
