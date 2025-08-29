// Utility functions for activity logging and formatting

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  eventType: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
}

/**
 * Format activity event for display in proctor monitoring
 */
export const formatActivityForDisplay = (
  eventType: string,
  studentName: string,
  details: any
): { description: string; severity?: string; icon?: string } => {
  switch (eventType) {
    case 'student_joined_exam':
      return {
        description: `${studentName} bergabung ke ujian`,
        severity: 'info',
        icon: 'user-plus'
      };

    case 'answer_update':
      const questionNum = details.question?.number || 'Unknown';
      const questionType = details.question?.type || 'unknown';
      
      if (questionType === 'multiple_choice') {
        const selectedOption = details.answer?.selected_option || 'Unknown';
        return {
          description: `${studentName} menjawab soal ${questionNum}: "${selectedOption}"`,
          severity: 'success',
          icon: 'check-circle'
        };
      } else if (questionType === 'essay') {
        const wordCount = details.answer?.word_count || 0;
        const charCount = details.answer?.character_count || 0;
        return {
          description: `${studentName} menulis jawaban soal ${questionNum} (${wordCount} kata, ${charCount} karakter)`,
          severity: 'success',
          icon: 'edit'
        };
      }
      
      return {
        description: `${studentName} menjawab soal ${questionNum}`,
        severity: 'success',
        icon: 'check-circle'
      };

    case 'question_navigation':
      const fromQ = details.navigation?.from_question || 'Unknown';
      const toQ = details.navigation?.to_question || 'Unknown';
      const timeSpent = details.navigation?.time_spent_seconds || 0;
      return {
        description: `${studentName} pindah dari soal ${fromQ} ke ${toQ} (${timeSpent}s)`,
        severity: 'info',
        icon: 'arrow-right'
      };

    case 'security_violation':
      const violationType = details.violation?.type || 'unknown';
      const violationDesc = details.violation?.description || 'Pelanggaran keamanan';
      const violationSeverity = details.violation?.severity || 'medium';
      return {
        description: `${studentName}: ${violationDesc}`,
        severity: violationSeverity,
        icon: 'alert-triangle'
      };

    case 'heartbeat':
      // Heartbeat should not be displayed as main activity
      return {
        description: `${studentName} aktif (soal ${details.current_question || 'Unknown'})`,
        severity: 'info',
        icon: 'activity'
      };

    default:
      return {
        description: `${studentName}: ${eventType}`,
        severity: 'info',
        icon: 'info'
      };
  }
};

/**
 * Determine if an activity should be shown in the main activity log
 */
export const shouldShowInActivityLog = (eventType: string): boolean => {
  // Don't show heartbeat in main activity log - it's too frequent and not informative
  const hiddenEvents = ['heartbeat'];
  return !hiddenEvents.includes(eventType);
};

/**
 * Get priority score for activity sorting (higher = more important)
 */
export const getActivityPriority = (eventType: string, severity?: string): number => {
  if (eventType === 'security_violation') {
    switch (severity) {
      case 'critical': return 100;
      case 'high': return 80;
      case 'medium': return 60;
      case 'low': return 40;
      default: return 50;
    }
  }

  switch (eventType) {
    case 'student_joined_exam': return 90;
    case 'answer_update': return 70;
    case 'question_navigation': return 30;
    case 'heartbeat': return 10;
    default: return 20;
  }
};

/**
 * Format timestamp for display
 */
export const formatActivityTimestamp = (timestamp: string | number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return `${diffSeconds}s yang lalu`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m yang lalu`;
  } else if (diffHours < 24) {
    return `${diffHours}h yang lalu`;
  } else {
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * Create activity log entry from WebSocket message
 */
export const createActivityLogEntry = (
  message: any,
  timestamp: string | number = Date.now()
): ActivityLogEntry | null => {
  const details = message.details || message;
  const eventType = details.eventType || message.type;
  
  if (!shouldShowInActivityLog(eventType)) {
    return null;
  }

  const studentId = details.studentId || details.student_id || 'unknown';
  const studentName = details.full_name || details.student_name || 'Unknown Student';
  
  const formatted = formatActivityForDisplay(eventType, studentName, details);
  
  return {
    id: `${studentId}_${eventType}_${timestamp}`,
    timestamp: typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString(),
    studentId,
    studentName,
    eventType,
    description: formatted.description,
    severity: formatted.severity as any,
    details
  };
};