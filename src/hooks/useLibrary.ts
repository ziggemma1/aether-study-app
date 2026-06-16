import { useState, useEffect } from 'react';
import api from '../services/api';

export interface LibraryMaterial {
  id: string;
  title: string;
  type: string;
  date: string;
  description: string;
  tags: string[];
  mastery: number;
  hasQuiz: boolean;
  hasFlashcards: boolean;
  hasNotes: boolean;
}

export function useLibrary() {
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // default

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/materials/library');
      if (res.data && Array.isArray(res.data.materials)) {
        setMaterials(res.data.materials);
      }
    } catch (err) {
      console.error('Failed to fetch library materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const filteredMaterials = materials
    .filter((m) => {
      // 1. Tab Filter
      if (filter !== 'All') {
        const queryFilter = filter.toLowerCase();
        // Support plural/singular/alias matches
        if (queryFilter === 'pdf') {
          if (m.type.toLowerCase() !== 'pdf') return false;
        } else if (queryFilter === 'notes') {
          if (m.type.toLowerCase() !== 'note' && m.type.toLowerCase() !== 'article') return false;
        } else if (queryFilter === 'videos') {
          if (m.type.toLowerCase() !== 'youtube' && m.type.toLowerCase() !== 'video') return false;
        } else if (queryFilter === 'quizzes') {
          if (!m.hasQuiz && m.type.toLowerCase() !== 'quiz') return false;
        }
      }

      // 2. Search query
      const query = search.toLowerCase();
      const titleMatch = (m.title || '').toLowerCase().includes(query);
      const descMatch = (m.description || '').toLowerCase().includes(query);
      const tagMatch = (m.tags || []).some((t) => (t || '').toLowerCase().includes(query));

      return titleMatch || descMatch || tagMatch;
    })
    .sort((a, b) => {
      // 3. Sorting
      if (sortBy === 'newest') {
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      }
      if (sortBy === 'a-z') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'z-a') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (sortBy === 'mastery') {
        return (b.mastery || 0) - (a.mastery || 0);
      }
      return 0;
    });

  return {
    materials: filteredMaterials,
    allMaterials: materials,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    refetch: fetchMaterials,
  };
}
