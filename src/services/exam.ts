import { 
  Exam, 
  ExamResponse, 
  ExamFilters, 
  CreateExamRequest, 
  UpdateExamRequest,
  ExamSubject,
  ExamClassData,
  TeacherResponse
} from '@/types/exam';
import { Question } from '@/services/questionBank';
import { ExpertiseProgram, AcademicPeriod } from '@/types/common';
import { BaseService } from './base';

class ExamService extends BaseService {
  async getExams(token: string, filters?: ExamFilters): Promise<ExamResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/exams/?${queryString}` : '/exams/';
    return this.get<ExamResponse>(endpoint, token);
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

    return this.post<Exam>('/exams/bulk-create', cleanedData, token);
  }

  async updateExam(token: string, examId: string, data: UpdateExamRequest): Promise<Exam> {
    return this.put<Exam>(`/exams/${examId}`, data, token);
  }

  async deleteExam(token: string, examId: string): Promise<void> {
    await this.delete(`/exams/${examId}`, token);
  }

  async getSubjects(token: string): Promise<ExamSubject[]> {
    const result = await this.get<{ data: ExamSubject[] }>('/subjects/', token);
    return result.data || [];
  }

  async getExpertisePrograms(token: string): Promise<ExpertiseProgram[]> {
    const result = await this.get<{ data: ExpertiseProgram[] }>('/expertise-programs/', token);
    return result.data || [];
  }

  async getClasses(token: string): Promise<ExamClassData[]> {
    const params = { limit: '100' };
    const queryString = this.buildQueryParams(params);
    const result = await this.get<{ data: ExamClassData[] }>(`/classes/?${queryString}`, token);
    return result.data || [];
  }

  async getTeachers(token: string): Promise<TeacherResponse> {
    return this.get<TeacherResponse>('/users/?role=teacher', token);
  }

  async getAcademicPeriods(token: string): Promise<AcademicPeriod[]> {
    return this.get<AcademicPeriod[]>('/academic-periods/', token);
  }

  async getQuestionsByIds(token: string, ids: string[]): Promise<Question[]> {
    return this.post<Question[]>('/question-banks/by-ids', { ids }, token);
  }

  async getExamById(token: string, examId: string): Promise<Exam> {
    return this.get<Exam>(`/exams/${examId}`, token);
  }
}

export const examService = new ExamService();