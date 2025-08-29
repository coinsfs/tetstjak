// WebSocket message types for proctor monitoring

export interface BaseWebSocketMessage {
  type: string;
  timestamp: number | string;
}

export interface RoomUserEvent extends BaseWebSocketMessage {
  type: 'room_user_event';
  action: 'connected' | 'disconnected';
  room_id: string;
  user: {
    user_id: string;
    username: string;
    roles: string[];
    user_type: 'student' | 'proctor';
    timestamp: number;
  };
  room_stats: {
    proctor_count: number;
    student_count: number;
    total_count: number;
  };
}

export interface StudentExamStartMessage extends BaseWebSocketMessage {
  type: 'student_exam_start';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'student_exam_start';
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    device_info: {
      screen_width: number;
      screen_height: number;
      viewport_width: number;
      viewport_height: number;
      user_agent: string;
      timezone: string;
    };
    timestamp: number;
  };
}

export interface StudentHeartbeatMessage extends BaseWebSocketMessage {
  type: 'student_heartbeat';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'student_heartbeat';
    student_id: string;
    exam_id: string;
    session_id: string;
    timestamp: number;
  };
}

export interface StudentAnswerUpdateMessage extends BaseWebSocketMessage {
  type: 'student_answer_update';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'activity_event';
    eventType: 'answer_update';
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    question: {
      id: string;
      number: number;
      type: 'multiple_choice' | 'essay';
    };
    answer: {
      type: 'multiple_choice' | 'essay';
      selected_option?: string;
      option_id?: string;
      text_preview?: string;
      character_count?: number;
      word_count?: number;
    };
    timestamp: number;
  };
}

export interface StudentViolationMessage extends BaseWebSocketMessage {
  type: 'student_violation';
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'activity_event';
    eventType: 'security_violation';
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    violation: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      details: any;
    };
    timestamp: number;
  };
}

export interface StudentActivityMessage extends BaseWebSocketMessage {
  type: 'student_activity';
  activityType: string;
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'activity_event';
    eventType: string;
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    timestamp: number;
    details?: any;
  };
}

// New interface for heartbeat messages (separate from activity)
export interface StudentHeartbeatMessage extends BaseWebSocketMessage {
  type: 'student_heartbeat';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'activity_event';
    eventType: 'heartbeat';
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    status: 'active';
    current_question: number;
    total_answered: number;
    time_remaining: number;
    timestamp: number;
  };
}

// New interface for question navigation
export interface StudentNavigationMessage extends BaseWebSocketMessage {
  type: 'student_navigation';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'activity_event';
    eventType: 'question_navigation';
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    navigation: {
      from_question: number;
      to_question: number;
      time_spent_seconds: number;
    };
    timestamp: number;
  };
}

// New interface for student joining exam
export interface StudentJoinMessage extends BaseWebSocketMessage {
  type: 'student_join';
  student_id: string;
  student_name: string;
  full_name: string;
  examId: string;
  raw_message: {
    type: 'activity_event';
    eventType: 'student_joined_exam';
    student_id: string;
    full_name: string;
    exam_id: string;
    session_id: string;
    device_info: {
      screen_size: string;
      browser: string;
      timezone: string;
    };
    timestamp: number;
  };
}

// Union type for all proctor monitoring messages
export type ProctorMonitoringMessage = 
  | RoomUserEvent
  | StudentJoinMessage
  | StudentHeartbeatMessage
  | StudentAnswerUpdateMessage
  | StudentNavigationMessage
  | StudentViolationMessage
  | StudentActivityMessage;

// Violation count interface
export interface ViolationCount {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// Connected user data structure
export interface ConnectedUser {
  user_id: string;
  username: string;
  full_name: string;
  roles: string[];
  user_type: 'student' | 'proctor';
  connected_at: number;
  last_activity: number;
}

// Student activity tracking
export interface StudentActivity {
  student_id: string;
  full_name: string;
  last_heartbeat: number;
  last_answer_update: number;
  total_answered: number;
  current_question: number;
  device_info?: {
    screen_width: number;
    screen_height: number;
    viewport_width: number;
    viewport_height: number;
    user_agent: string;
    timezone: string;
  };
  violations: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recent_violations: StudentViolationMessage[];
}

// Room statistics
export interface RoomStats {
  proctor_count: number;
  student_count: number;
  total_count: number;
  last_updated: number;
}