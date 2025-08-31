import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BasicTeacher } from '@/types/user';
import { userService } from '@/services';

interface TeacherCacheContextType {
  teachers: BasicTeacher[];
  loading: boolean;
  error: string | null;
  searchTeachers: (searchTerm: string) => BasicTeacher[];
  getTeacherById: (id: string) => BasicTeacher | undefined;
  refreshTeachers: () => Promise<void>;
}

const TeacherCacheContext = createContext<TeacherCacheContextType | undefined>(undefined);

interface TeacherCacheProviderProps {
  children: React.ReactNode;
  token: string;
}

export const TeacherCacheProvider: React.FC<TeacherCacheProviderProps> = ({ 
  children, 
  token 
}) => {
  const [teachers, setTeachers] = useState<BasicTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for search results with cleanup mechanism
  const [searchCache] = useState(() => {
    const cache = new Map<string, BasicTeacher[]>();
    
    // Clear cache periodically to prevent memory buildup
    const clearCacheInterval = setInterval(() => {
      if (cache.size > 50) { // Clear if cache gets too large
        cache.clear();
      }
    }, 60000); // Clear every minute
    
    // Store cleanup function in cache object for later use
    (cache as any).cleanup = () => {
      clearInterval(clearCacheInterval);
      cache.clear();
    };
    
    return cache;
  });

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup search cache when component unmounts
      if ((searchCache as any).cleanup) {
        (searchCache as any).cleanup();
      }
    };
  }, [searchCache]);

  const loadTeachers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load all basic teachers at once without search term
      const allTeachers = await userService.getBasicTeachers(token);
      setTeachers(allTeachers);
      
      // Clear search cache when base data changes
      searchCache.clear();
    } catch (err) {
      console.error('Failed to load teachers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [token, searchCache]);

  // Load teachers on mount
  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const searchTeachers = useCallback((searchTerm: string): BasicTeacher[] => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    
    // Return all teachers if no search term
    if (!trimmedSearch) {
      return teachers;
    }

    // Check cache first
    if (searchCache.has(trimmedSearch)) {
      return searchCache.get(trimmedSearch)!;
    }

    // Filter teachers by search term
    const filtered = teachers.filter(teacher => 
      teacher.full_name.toLowerCase().includes(trimmedSearch)
    );

    // Cache the result only if cache isn't too large
    if (searchCache.size < 50) {
      searchCache.set(trimmedSearch, filtered);
    }
    
    return filtered;
  }, [teachers, searchCache]);

  const getTeacherById = useCallback((id: string): BasicTeacher | undefined => {
    return teachers.find(teacher => teacher._id === id);
  }, [teachers]);

  const refreshTeachers = useCallback(async () => {
    await loadTeachers();
  }, [loadTeachers]);

  const value: TeacherCacheContextType = {
    teachers,
    loading,
    error,
    searchTeachers,
    getTeacherById,
    refreshTeachers
  };

  return (
    <TeacherCacheContext.Provider value={value}>
      {children}
    </TeacherCacheContext.Provider>
  );
};

export const useTeacherCache = (): TeacherCacheContextType => {
  const context = useContext(TeacherCacheContext);
  if (!context) {
    throw new Error('useTeacherCache must be used within a TeacherCacheProvider');
  }
  return context;
};