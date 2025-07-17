export interface Exam {
    title: string;
    exam_type: string;
    duration_minutes: number;
    availability_start_time: string;
    availability_end_time: string;
    status: string;
    settings: {
      shuffle_questions: boolean;
      shuffle_options: boolean;
      show_results_after_submission: boolean;
    };
    academic_period_id: string;
    _id: string;
    teaching_assignment_id: string;
    proctor_ids: string[];
    teaching_assignment_details: {
      class_id: string;
      subject_id: string;
      teacher_id: string;
      _id: string;
      class_details: {
        grade_level: number;
        expertise_id: string;
        name: string;
        academic_year: string;
        homeroom_teacher_id: string;
        _id: string;
      };
      subject_details: {
        name: string;
        code: string;
        _id: string;
      };
      teacher_details: {
        login_id: string;
        email: string;
        is_active: boolean;
        roles: string[];
        profile_id: string;
        class_id: string | null;
        department_id: string | null;
        created_at: string;
        updated_at: string;
        onboarding_completed: boolean;
        password_last_changed_at: string | null;
        _id: string;
      };
    };
    academic_period_details: {
      year: string;
      semester: string;
      status: string;
      start_date: string;
      end_date: string;
      _id: string;
    };
    questions: any;
  }
  
  export interface ExamResponse {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
    data: Exam[];
  }
  
  export interface ExamFilters {
    search?: string;
    page?: number;
    limit?: number;
    academic_period_id?: string;
    exam_type?: string;
  }
  
  export interface CreateExamRequest {
    title: string;
    exam_type: string;
    duration_minutes: number;
    availability_start_time: string;
    availability_end_time: string;
    settings: {
      shuffle_questions: boolean;
      shuffle_options: boolean;
      show_results_after_submission: boolean;
    };
    target_criteria: {
      subject_id: string;
      grade_level?: number;
      expertise_id?: string;
      class_id?: string;
    };
    proctor_ids: string[];
  }
  
  export interface UpdateExamRequest {
    title: string;
    exam_type: string;
    duration_minutes: number;
    availability_start_time: string;
    availability_end_time: string;
    status: string;
    proctor_ids: string[];
    settings: {
      shuffle_questions: boolean;
      shuffle_options: boolean;
      show_results_after_submission: boolean;
    };
  }
  
  export interface Subject {
    name: string;
    code: string;
    _id: string;
  }
  
  export interface ExpertiseProgram {
    name: string;
    abbreviation: string;
    description: string;
    head_of_department_id: string;
    _id: string;
  }
  
  export interface ClassData {
    grade_level: number;
    expertise_id: string;
    name: string;
    academic_year: string;
    homeroom_teacher_id: string;
    _id: string;
    homeroom_teacher_details: any;
    expertise_details: {
      name: string;
      abbreviation: string;
      description: string;
      head_of_department_id: string;
      _id: string;
    };
  }
  
  export interface Teacher {
    login_id: string;
    email: string;
    is_active: boolean;
    roles: string[];
    profile_id: string;
    class_id: string | null;
    department_id: string | null;
    created_at: string;
    updated_at: string;
    onboarding_completed: boolean;
    password_last_changed_at: string | null;
    _id: string;
    profile_details: {
      user_id: string;
      full_name: string;
      gender: string;
      birth_date: string;
      birth_place: string;
      address: string;
      phone_number: string;
      class_id: string;
      department_id: string;
      start_year: number | null;
      end_year: number | null;
      profile_picture_url: string | null;
      profile_picture_key: string | null;
      created_at: string;
      updated_at: string;
      _id: string;
    };
    class_details: {
      grade_level: number;
      expertise_id: string;
      name: string;
      academic_year: string;
      homeroom_teacher_id: string;
      _id: string;
    };
    department_details: {
      name: string;
      abbreviation: string;
      description: string;
      head_of_department_id: string;
      _id: string;
    };
    teaching_summary: any[];
  }
  
  export interface TeacherResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: Teacher[];
  }
  
  export const EXAM_TYPES = [
    { value: 'official_uts', label: 'UTS (Ujian Tengah Semester)' },
    { value: 'official_uas', label: 'UAS (Ujian Akhir Semester)' },
    { value: 'quiz', label: 'Kuis' },
    { value: 'assignment', label: 'Tugas' },
    { value: 'practice', label: 'Latihan' }
  ];
  
  export const EXAM_STATUS = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending_questions', label: 'Menunggu Soal', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ready', label: 'Siap', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Selesai', color: 'bg-purple-100 text-purple-800' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
  ];