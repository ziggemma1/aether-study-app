import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Material, SavedPlan } from '../types';
import { authApi, materialApi } from '../services/api';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  materials: Material[];
  setMaterials: (materials: Material[]) => void;
  savedPlans: SavedPlan[];
  setSavedPlans: React.Dispatch<React.SetStateAction<SavedPlan[]>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  refreshUser: () => Promise<void>;
  refreshMaterials: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); 
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const refreshMaterials = async () => {
    try {
      const response = await materialApi.getAll();
      setMaterials(response.data);
    } catch (error) {
      console.error('Failed to fetch materials', error);
      setMaterials([]);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data.user);
      await refreshMaterials();
    } catch (error) {
      setUser(null);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // When user signs in, load materials
  useEffect(() => {
    if (user) {
      refreshMaterials();
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ 
      user, 
      setUser, 
      materials, 
      setMaterials, 
      savedPlans,
      setSavedPlans,
      isLoading, 
      setIsLoading,
      theme,
      toggleTheme,
      refreshUser,
      refreshMaterials
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
