import { useCallback, useRef } from 'react';
import { teacherService } from '../services/teacherService';
import { studentService } from '../services/studentService';
import { examService } from '../services/examService';
import { subjectService } from '../services/subjectService';
import { TeacherFilters } from '../types/teacher';
import { StudentFilters } from '../types/student';
import { ExamFilters } from '../types/exam';
import { SubjectFilters } from '../types/subject';

interface PrefetchCache {
  teachers?: any;
  students?: any;
  exams?: any;
  subjects?: any;
  timestamp?: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const usePrefetch = (token: string | null) => {
  const cacheRef = useRef<PrefetchCache>({});

  const isCacheValid = useCallback((key: keyof PrefetchCache) => {
    const cache = cacheRef.current;
    if (!cache[key] || !cache.timestamp) return false;
    
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }, []);

  const prefetchTeachers = useCallback(async () => {
    if (!token || isCacheValid('teachers')) return;

    try {
      console.log('Prefetching teachers data...');
      const filters: TeacherFilters = {};
      const response = await teacherService.getTeachers(token, 0, 10, filters);
      
      cacheRef.current.teachers = response;
      cacheRef.current.timestamp = Date.now();
      console.log('Teachers data prefetched successfully');
    } catch (error) {
      console.log('Failed to prefetch teachers:', error);
    }
  }, [token, isCacheValid]);

  const prefetchStudents = useCallback(async () => {
    if (!token || isCacheValid('students')) return;

    try {
      console.log('Prefetching students data...');
      const filters: StudentFilters = {};
      const response = await studentService.getStudents(token, 0, 10, filters);
      
      cacheRef.current.students = response;
      cacheRef.current.timestamp = Date.now();
      console.log('Students data prefetched successfully');
    } catch (error) {
      console.log('Failed to prefetch students:', error);
    }
  }, [token, isCacheValid]);

  const prefetchExams = useCallback(async () => {
    if (!token || isCacheValid('exams')) return;

    try {
      console.log('Prefetching exams data...');
      const filters: ExamFilters = { page: 1, limit: 10 };
      const response = await examService.getExams(token, filters);
      
      cacheRef.current.exams = response;
      cacheRef.current.timestamp = Date.now();
      console.log('Exams data prefetched successfully');
    } catch (error) {
      console.log('Failed to prefetch exams:', error);
    }
  }, [token, isCacheValid]);

  const prefetchSubjects = useCallback(async () => {
    if (!token || isCacheValid('subjects')) return;

    try {
      console.log('Prefetching subjects data...');
      const filters: SubjectFilters = { page: 1, limit: 10 };
      const response = await subjectService.getSubjects(token, filters);
      
      cacheRef.current.subjects = response;
      cacheRef.current.timestamp = Date.now();
      console.log('Subjects data prefetched successfully');
    } catch (error) {
      console.log('Failed to prefetch subjects:', error);
    }
  }, [token, isCacheValid]);

  const getCachedData = useCallback((key: keyof PrefetchCache) => {
    if (isCacheValid(key)) {
      return cacheRef.current[key];
    }
    return null;
  }, [isCacheValid]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    prefetchTeachers,
    prefetchStudents,
    prefetchExams,
    prefetchSubjects,
    getCachedData,
    clearCache
  };
};