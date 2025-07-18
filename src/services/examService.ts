import { 
    Exam, 
    ExamResponse, 
    ExamFilters, 
    CreateExamRequest, 
    UpdateExamRequest,
    Subject,
    ExpertiseProgram,
    ClassData,
    TeacherResponse,
    AcademicPeriod,
    Question
  } from '../types/exam';
  
  const API_BASE_URL = 'http://192.168.250.9:8000/api/v1';
  
  class ExamService {
    async getExams(token: string, filters?: ExamFilters): Promise<ExamResponse> {
      const url = new URL(`${API_BASE_URL}/exams`);
      
      if (filters?.page) {
        url.searchParams.append('page', filters.page.toString());
      }
      
      if (filters?.limit) {
        url.searchParams.append('limit', filters.limit.toString());
      }
      
      if (filters?.search) {
        url.searchParams.append('search', filters.search);
      }
      
      if (filters?.academic_period_id) {
        url.searchParams.append('academic_period_id', filters.academic_period_id);
      }
      
      if (filters?.exam_type) {
        url.searchParams.append('exam_type', filters.exam_type);
      }
      
      if (filters?.grade_level) {
        url.searchParams.append('grade_level', filters.grade_level);
      }
  
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
  
      return response.json();
    }
  
    async createExam(token: string, data: CreateExamRequest): Promise<Exam> {
      // Clean up empty values from target_criteria
      const cleanedTargetCriteria: any = {
        subject_id: data.target_criteria.subject_id
      };
  
      if (data.target_criteria.grade_level) {
        cleanedTargetCriteria.grade_level = data.target_criteria.grade_level;
      }
  
      if (data.target_criteria.expertise_id) {
        cleanedTargetCriteria.expertise_id = data.target_criteria.expertise_id;
      }
  
      if (data.target_criteria.class_id) {
        cleanedTargetCriteria.class_id = data.target_criteria.class_id;
      }
  
      const cleanedData = {
        ...data,
        target_criteria: cleanedTargetCriteria
      };
  
      const response = await fetch(`${API_BASE_URL}/exams/bulk-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create exam');
      }
  
      return response.json();
    }
  
    async updateExam(token: string, examId: string, data: UpdateExamRequest): Promise<Exam> {
      const response = await fetch(`${API_BASE_URL}/exams/${examId}/questions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update exam');
      }
  
      return response.json();
    }
  
    async deleteExam(token: string, examId: string): Promise<void> {
      const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete exam');
      }
    }
  
    async getSubjects(token: string): Promise<Subject[]> {
      const response = await fetch(`${API_BASE_URL}/subjects/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
  
      return response.json();
    }
  
    async getExpertisePrograms(token: string): Promise<ExpertiseProgram[]> {
      const response = await fetch(`${API_BASE_URL}/expertise-programs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch expertise programs');
      }
  
      return response.json();
    }
  
    async getClasses(token: string): Promise<ClassData[]> {
      const response = await fetch(`${API_BASE_URL}/classes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
  
      return response.json();
    }
  
    async getTeachers(token: string): Promise<TeacherResponse> {
      const response = await fetch(`${API_BASE_URL}/users/?role=teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
  
      return response.json();
    }

    async getAcademicPeriods(token: string): Promise<AcademicPeriod[]> {
      const response = await fetch(`${API_BASE_URL}/academic-periods/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch academic periods');
      }

      return response.json();
    }

    async getQuestionsByIds(token: string, ids: string[]): Promise<Question[]> {
      const response = await fetch(`${API_BASE_URL}/question-banks/by-ids`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      return response.json();
    }
  }
  
  export const examService = new ExamService();