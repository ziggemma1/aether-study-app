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

  const deleteMaterial = async (id: string) => {
    try {
      console.log(`[useLibrary] Deleting material: ${id}`);
      await api.delete(`/materials/${id}`);
      setMaterials(prev => prev.filter(m => (m.id !== id && (m as any)._id !== id)));
      return true;
    } catch (err) {
      console.error('Failed to delete material:', err);
      return false;
    }
  };

  const deleteMaterials = async (ids: string[]) => {
    try {
      console.log(`[useLibrary] Bulk deleting materials:`, ids);
      await api.post('/materials/bulk-delete', { ids });
      setMaterials(prev => prev.filter(m => {
        const materialId = m.id || (m as any)._id;
        return !ids.includes(materialId);
      }));
      return true;
    } catch (err) {
      console.error('Failed to bulk delete materials:', err);
      return false;
    }
  };

  const mergeMaterials = async (ids: string[], title: string) => {
    try {
      // 1. Fetch details of all materials to merge
      const detailedMaterials = await Promise.all(
        ids.map(id => api.get(`/materials/${id}`).then(res => res.data))
      );

      // 2. Combine their contents
      const combinedContent = detailedMaterials
        .map(m => `--- ${m.title} ---\n${m.content || m.summary || ''}`)
        .join('\n\n');

      const combinedSummary = `Unified study material merged from: ${detailedMaterials.map(m => m.title).join(', ')}`;
      
      const allTags = new Set<string>();
      detailedMaterials.forEach(m => {
        if (m.keyTopics) m.keyTopics.forEach((t: string) => allTags.add(t));
      });

      // 3. Create the new merged material
      const res = await api.post('/materials', {
        title,
        type: 'unified',
        content: combinedContent,
        summary: combinedSummary,
        keyTopics: Array.from(allTags).slice(0, 5),
        isPublic: false
      });

      if (res.data) {
        await fetchMaterials();
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to merge materials:', err);
      return null;
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
    deleteMaterial,
    deleteMaterials,
    mergeMaterials,
  };
}
