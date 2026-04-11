import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Material, SavedPlan } from '../types';
import { MOCK_USER, MOCK_MATERIALS } from '../mockData';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER); // Default to mock user for demo
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

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
      toggleTheme
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
