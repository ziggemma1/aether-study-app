import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Material, SavedPlan, Message, StudySession, Achievement, QuizResult, Group, FriendRequest } from '../types';
import api from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';
import { translations, Language } from '../lib/translations';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  savedPlans: SavedPlan[];
  setSavedPlans: React.Dispatch<React.SetStateAction<SavedPlan[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  friendRequests: FriendRequest[];
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
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
  timeTheme: string;
  toggleTheme: () => void;
  signOut: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error') => void;
  toast: { text: string, type: 'success' | 'error' } | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  sendMessage: (content: string, receiverId?: string, groupId?: string) => void;
  typingUsers: Record<string, boolean>;
  setTyping: (isTyping: boolean, receiverId?: string, groupId?: string) => void;
  toggleFollow: (targetUserId: string) => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, status: 'accepted' | 'declined') => Promise<void>;
  updateMaterialInContext: (updatedMaterial: Material) => void;
  fetchAppData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timeTheme, setTimeTheme] = useState('');

  // Determine time-of-day theme
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) setTimeTheme('theme-morning');
      else if (hour >= 12 && hour < 18) setTimeTheme('theme-day');
      else if (hour >= 18 && hour < 22) setTimeTheme('theme-sunset');
      else setTimeTheme('theme-night');
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const [toast, setToast] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const lang = (user?.language as Language) || 'English (US)';
    const langGroup = translations[lang] || translations['English (US)'];
    let text = langGroup[key] || translations['English (US)'][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
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
    setGroups([]);
    setStudySessions([]);
    setAchievements([]);
    setQuizResults([]);
    disconnectSocket();
    localStorage.removeItem('user');
    localStorage.removeItem('cached_materials');
  };

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.user) {
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      return false;
    } catch (err: any) {
      console.log('Not authenticated or error checking auth');
      if (err.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('user');
      }
      return false;
    }
  }, []);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    try {
      const res = await api.post(`/users/follow/${targetUserId}`);
      if (res.data) {
        setUser(prev => prev ? { ...prev, following: res.data.following, friendsCount: res.data.friendsCount } : null);
        showToast(res.data.isFollowing ? 'Followed successfully' : 'Unfollowed successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to toggle follow', 'error');
    }
  }, []);

  const sendFriendRequest = useCallback(async (receiverId: string) => {
    try {
      const res = await api.post('/users/friend-request', { receiverId });
      if (res.data) {
        showToast('Friend request sent!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send friend request', 'error');
    }
  }, []);

  const respondToFriendRequest = useCallback(async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const res = await api.post('/users/friend-request/respond', { requestId, status });
      if (res.data) {
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        showToast(`Friend request ${status}`, 'success');
        if (status === 'accepted') {
          // Re-fetch user data to update friend counts/following
          await fetchUserData();
          await fetchAppData();
        }

      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to respond to friend request', 'error');
    }
  }, [fetchUserData]);

  const sendMessage = useCallback((content: string, receiverId?: string, groupId?: string) => {
    const socket = getSocket(); // Handled by cookie
    if (socket) {
      socket.emit("send_message", { content, receiverId, groupId });
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean, receiverId?: string, groupId?: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("typing", { isTyping, receiverId, groupId });
    }
  }, []);

  useEffect(() => {
    if (user) {
      const socket = getSocket();
      if (socket) {
        socket.on("new_message", (message: Message) => {
          setMessages(prev => {
            const msgId = message.id || (message as any)._id;
            // Prevent duplicate message renders
            if (prev.some(m => m.id === msgId || (m as any)._id === msgId)) return prev;
            return [...prev, { ...message, id: msgId }];
          });
          
          // Show toast if not current recipient (simple logic for now)
          if (message.senderId !== user.id) {
            showToast(`New message`, 'success');
          }
        });

        socket.on("typing_update", (data: { userId: string, isTyping: boolean, groupId?: string }) => {
          setTypingUsers(prev => ({
            ...prev,
            [data.groupId || data.userId]: data.isTyping
          }));
        });

        socket.on("error_message", (data: { message: string }) => {
          showToast(data.message, 'error');
        });

        // Join rooms for user groups
        groups.forEach(g => {
          socket.emit("join_group", g.id);
        });

        return () => {
          socket.off("new_message");
          socket.off("typing_update");
        };
      }
    }
  }, [user, groups]);

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

  const fetchAppData = useCallback(async () => {

    const endpoints = [
      { key: 'materials', url: '/materials', setter: setMaterials },
      { key: 'sessions', url: '/sessions', setter: setStudySessions },
      { key: 'quizzes', url: '/quizzes', setter: setQuizResults },
      { key: 'messages', url: '/messages', setter: setMessages },
      { key: 'groups', url: '/groups', setter: setGroups },
      { key: 'profiles', url: '/users/profiles', setter: setAllProfiles },
      { key: 'requests', url: '/users/friend-requests', setter: setFriendRequests }
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

  useEffect(() => {
    (window as any).refreshMaterials = fetchAppData;
    return () => {
      delete (window as any).refreshMaterials;
    };
  }, [fetchAppData]);

  const initialize = useCallback(async () => {
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
      setMaterials([]);
    }
    setIsLoading(false);
  }, [fetchUserData, fetchAppData]);

  useEffect(() => {
    if (!dbError) return;
    let pollInterval: any;
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        if (response.data.dbConnected) {
          setDbError(null);
          initialize();
        }
      } catch (err) {}
    };
    pollInterval = setInterval(checkHealth, 3000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [dbError, initialize]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const updateMaterialInContext = (updatedMaterial: Material) => {
    setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };

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
      groups,
      setGroups,
      friendRequests,
      setFriendRequests,
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
      timeTheme,
      toggleTheme,
      signOut,
      showToast,
      toast,
      t,
      sendMessage,
      typingUsers,
      setTyping,
      toggleFollow,
      sendFriendRequest,
      respondToFriendRequest,
      updateMaterialInContext,
      fetchAppData
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
