import { useCallback, useRef } from 'react';
import { userService } from '@/services/user';
import { examService } from '@/services/exam';
import { subjectService } from '@/services/subject';
import { classService } from '@/services/class';
import { expertiseProgramService } from '@/services/expertise';
import { TeacherFilters, StudentFilters } from '@/types/user';
import { ExamFilters } from '@/types/exam';
import { SubjectFilters } from '@/types/subject';
import { ClassFilters } from '@/types/class';
import { ExpertiseProgramFilters } from '@/types/expertise';

interface PrefetchCache {
  teachers?: any;
  students?: any;
  exams?: any;
  subjects?: any;
  classes?: any;
  expertisePrograms?: any;
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
      const response = await userService.getTeachers(token, 0, 10, filters);
      
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
      const response = await userService.getStudents(token, 0, 10, filters);
      
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

  const prefetchClasses = useCallback(async () => {
    if (!token || isCacheValid('classes')) return;

    try {
      console.log('Prefetching classes data...');
      const filters: ClassFilters = { page: 1, limit: 10 };
      const response = await classService.getClasses(token, filters);
      
      cacheRef.current.classes = response;
      cacheRef.current.timestamp = Date.now();
      console.log('Classes data prefetched successfully');
    } catch (error) {
      console.log('Failed to prefetch classes:', error);
    }
  }, [token, isCacheValid]);

  const prefetchExpertisePrograms = useCallback(async () => {
    if (!token || isCacheValid('expertisePrograms')) return;

    try {
      console.log('Prefetching expertise programs data...');
      const filters: ExpertiseProgramFilters = { page: 1, limit: 10 };
      const response = await expertiseProgramService.getExpertisePrograms(token, filters);
      
      cacheRef.current.expertisePrograms = response;
      cacheRef.current.timestamp = Date.now();
      console.log('Expertise programs data prefetched successfully');
    } catch (error) {
      console.log('Failed to prefetch expertise programs:', error);
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
    prefetchClasses,
    prefetchExpertisePrograms,
    getCachedData,
    clearCache
  };
};