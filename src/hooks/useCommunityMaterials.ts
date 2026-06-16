import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

export interface CommunityMaterial {
  id: string;
  _id?: string;
  title: string;
  type: string;
  summary?: string;
  content?: string;
  keyTopics?: string[];
  likes: number;
  downloads: number;
  authorName?: string;
  category?: string;
  rating: number;
  createdAt: string;
  isPublic: boolean;
  hasQuiz?: boolean;
}

export function useCommunityMaterials() {
  const { showToast, setMaterials: setLibraryMaterials } = useAppContext();
  const [rawMaterials, setRawMaterials] = useState<CommunityMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fitlers/Search state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // 'All' | 'PDF' | 'Notes' | 'Flashcards' | 'Videos'
  const [sort, setSort] = useState('popular'); // 'popular' | 'highest-rated' | 'newest' | 'downloads'
  const [subject, setSubject] = useState('All'); // 'All' | Specific subjects
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const fetchCommunityMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/public');
      if (Array.isArray(res.data)) {
        const formatted = res.data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
          title: item.title || 'Untitled Material',
          type: item.type || 'note',
          likes: item.likes ?? 0,
          downloads: item.downloads ?? 0,
          rating: item.rating ?? 4.5,
          createdAt: item.createdAt || new Date().toISOString(),
          keyTopics: item.keyTopics || item.tags || []
        }));
        setRawMaterials(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch community materials:', err);
      showToast('Could not load community notes. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCommunityMaterials();
  }, [fetchCommunityMaterials]);

  // Clone material
  const cloneMaterial = async (materialId: string, title: string) => {
    try {
      const res = await api.post(`/materials/clone/${materialId}`);
      if (setLibraryMaterials) {
        setLibraryMaterials((prev: any[]) => [res.data, ...prev]);
      }
      
      // Update local download and clone indicators
      setRawMaterials(prev => 
        prev.map(m => m.id === materialId ? { ...m, downloads: m.downloads + 1, likes: m.likes + 1 } : m)
      );

      showToast(`📚 "${title}" has been successfully cloned to your library!`, 'success');
      return { success: true, data: res.data };
    } catch (err: any) {
      console.error('Cloning failed:', err);
      showToast(err.response?.data?.message || 'Failed to clone material', 'error');
      return { success: false, error: err };
    }
  };

  // Upload/Share material
  const uploadCommunityMaterial = async (formData: {
    title: string;
    type: string;
    summary?: string;
    content?: string;
    keyTopics: string[];
    category?: string;
  }) => {
    try {
      const res = await api.post('/materials', {
        ...formData,
        isPublic: true
      });

      // Fetch updated list
      await fetchCommunityMaterials();

      showToast('📤 Material shared successfully with the community!', 'success');
      return { success: true, data: res.data };
    } catch (err: any) {
      console.error('Failed to upload community material:', err);
      showToast(err.response?.data?.message || 'Failed to share material', 'error');
      return { success: false, error: err };
    }
  };

  // Derive unique subjects from tags/keyTopics & category
  const subjects = useMemo(() => {
    const list = new Set<string>();
    rawMaterials.forEach((m) => {
      if (m.category) list.add(m.category);
      if (m.keyTopics) {
        m.keyTopics.forEach(t => {
          if (t && t.length < 15) list.add(t);
        });
      }
    });
    return ['All', ...Array.from(list)];
  }, [rawMaterials]);

  // Combined search, filtering, and sorting
  const filteredAndSortedMaterials = useMemo(() => {
    return rawMaterials
      .filter((m) => {
        // 1. Search filter
        const query = search.toLowerCase();
        const matchesQuery = 
          m.title.toLowerCase().includes(query) ||
          (m.summary || '').toLowerCase().includes(query) ||
          (m.authorName || '').toLowerCase().includes(query) ||
          (m.category || '').toLowerCase().includes(query) ||
          (m.keyTopics || []).some(t => t.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        // 2. Tab Category filter
        if (filter !== 'All') {
          const tab = filter.toLowerCase();
          const normType = m.type.toLowerCase();
          if (tab === 'pdf' && normType !== 'pdf') return false;
          if (tab === 'notes' && !['note', 'article', 'unified'].includes(normType)) return false;
          if (tab === 'flashcards' && !['flashcard', 'flashcards'].includes(normType) && (!m.keyTopics?.includes('Flashcards') && normType !== 'flashcards')) {
            // If they want flashcards, but the type isn't flashcards, let's also allow if it has standard questions
            if (normType !== 'flashcards') return false;
          }
          if (tab === 'videos' && !['youtube', 'video'].includes(normType)) return false;
        }

        // 3. Subject dropdown filter
        if (subject !== 'All') {
          const sub = subject.toLowerCase();
          const matchesSubject = 
            (m.category || '').toLowerCase() === sub ||
            (m.keyTopics || []).some(t => t.toLowerCase() === sub);
          if (!matchesSubject) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sorting logic
        if (sort === 'popular' || sort === 'downloads') {
          return b.downloads - a.downloads;
        }
        if (sort === 'highest-rated') {
          return b.rating - a.rating;
        }
        if (sort === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [rawMaterials, search, filter, subject, sort]);

  // Paginated materials
  const paginatedMaterials = useMemo(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    return filteredAndSortedMaterials.slice(startIndex, endIndex);
  }, [filteredAndSortedMaterials, page, itemsPerPage]);

  const hasMore = paginatedMaterials.length < filteredAndSortedMaterials.length;

  return {
    materials: paginatedMaterials,
    allFilteredCount: filteredAndSortedMaterials.length,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    subject,
    setSubject,
    page,
    setPage,
    hasMore,
    subjects,
    cloneMaterial,
    uploadCommunityMaterial,
    refetch: fetchCommunityMaterials
  };
}
