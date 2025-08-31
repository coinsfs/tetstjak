import { BaseService } from './base';

export interface ViolationLog {
  violation_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string; // ISO datetime string
  context?: Record<string, any>;
  auto_detected: boolean;
  details?: string;
  // Legacy fields for backward compatibility
  examId?: string;
  studentId?: string;
  userAgent?: string;
  url?: string;
  tabActive?: boolean;
  mousePosition?: { x: number; y: number; clicks: number };
  keyboardStats?: { keystrokes: number; suspiciousKeys: number };
}

export interface SecurityReport {
  examId: string;
  studentId: string;
  sessionId: string;
  violations: ViolationLog[];
  summary: {
    totalViolations: number;
    violationsBySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    tabSwitches: number;
    timeSpentInactive: number;
    suspiciousActivity: boolean;
  };
  deviceFingerprint: string;
  startTime: number;
  endTime: number;
}

export interface SubmitExamAllRequest {
  answers: Record<string, any>;
  interaction_logs: InteractionLog[];
  violations: ViolationLog[];
  client_metadata: Record<string, any>;
}

export interface InteractionLog {
  timestamp: string;
  question_id: string;
  displayed_position: number;
  action: string;
  student_answer?: string;
}

export interface SubmitExamWithSecurityRequest {
  examId: string;
  sessionId: string;
  answers: Record<string, any>;
  securityReport: SecurityReport;
  submissionType: 'manual' | 'auto_time' | 'auto_violation';
}

class ExamSecurityService extends BaseService {
  /**
   * Submit exam answers with interaction logs and violations (new API)
   */
  async submitExamAll(
    token: string,
    sessionId: string,
    request: SubmitExamAllRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(
      `/exam-sessions/${sessionId}/submit-all`,
      request,
      token
    );
  }

  /**
   * Submit exam answers along with security report (legacy)
   */
  async submitExamWithSecurity(
    token: string, 
    request: SubmitExamWithSecurityRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(
      '/exam-sessions/submit-with-security', 
      request, 
      token
    );
  }

  /**
   * Submit exam with the new API format (recommended)
   */
  async submitExam(
    token: string,
    sessionId: string,
    answers: Record<string, any>,
    securityReport: SecurityReport,
    submissionType: 'manual' | 'auto_time' | 'auto_violation'
  ): Promise<{ success: boolean; message: string }> {
    // Convert to new format
    const submitRequest = this.convertToSubmitAllFormat(
      sessionId,
      answers,
      securityReport,
      submissionType
    );

    // Use the correct new endpoint
    return await this.submitExamAll(token, sessionId, submitRequest);
  }

  /**
   * Store interaction log for later submission
   */
  storeInteractionLog(
    sessionId: string,
    questionId: string,
    displayedPosition: number,
    action: string,
    studentAnswer?: string
  ): void {
    const log: InteractionLog = {
      timestamp: new Date().toISOString(),
      question_id: questionId,
      displayed_position: displayedPosition,
      action,
      student_answer: studentAnswer
    };

    const logsKey = `interaction_logs_${sessionId}`;
    const existingLogs = localStorage.getItem(logsKey);
    const logs: InteractionLog[] = existingLogs ? JSON.parse(existingLogs) : [];
    
    logs.push(log);
    localStorage.setItem(logsKey, JSON.stringify(logs));
  }

  /**
   * Send periodic security updates during exam
   */
  async sendSecurityUpdate(
    token: string,
    examId: string,
    studentId: string,
    violations: ViolationLog[]
  ): Promise<void> {
    const request = {
      examId,
      studentId,
      violations,
      timestamp: Date.now()
    };

    return this.post('/exam-sessions/security-update', request, token);
  }

  /**
   * Report critical security violation
   */
  async reportCriticalViolation(
    token: string,
    examId: string,
    studentId: string,
    violation: ViolationLog
  ): Promise<{ action: 'continue' | 'terminate' }> {
    const request = {
      examId,
      studentId,
      violation,
      timestamp: Date.now()
    };

    return this.post<{ action: 'continue' | 'terminate' }>(
      '/exam-sessions/critical-violation', 
      request, 
      token
    );
  }

  /**
   * Get security configuration for exam
   */
  async getSecurityConfig(
    token: string,
    examId: string
  ): Promise<{
    maxTabSwitches: number;
    maxInactiveTime: number;
    allowedViolations: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    strictMode: boolean;
  }> {
    return this.get(`/exams/${examId}/security-config`, token);
  }

  /**
   * Validate device fingerprint
   */
  async validateDeviceFingerprint(
    token: string,
    examId: string,
    studentId: string,
    fingerprint: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const request = {
      examId,
      studentId,
      fingerprint
    };

    return this.post<{ valid: boolean; reason?: string }>(
      '/exam-sessions/validate-device', 
      request, 
      token
    );
  }

  /**
   * Check for existing exam session
   */
  async checkExistingSession(
    token: string,
    examId: string,
    studentId: string
  ): Promise<{ 
    hasActiveSession: boolean; 
    sessionId?: string; 
    deviceFingerprint?: string;
  }> {
    const params = { examId, studentId };
    const queryString = this.buildQueryParams(params);
    
    return this.get(`/exam-sessions/check-existing?${queryString}`, token);
  }

  /**
   * Generate security report from stored violations
   */
  generateSecurityReport(
    examId: string,
    studentId: string,
    sessionId: string,
    startTime: number
  ): SecurityReport {
    const violationsKey = `exam_violations_${examId}_${studentId}`;
    const storedViolations = localStorage.getItem(violationsKey);
    const violations: ViolationLog[] = storedViolations ? JSON.parse(storedViolations) : [];

    // Calculate summary statistics
    const summary = {
      totalViolations: violations.length,
      violationsBySeverity: {
        low: violations.filter(v => v.severity === 'low').length,
        medium: violations.filter(v => v.severity === 'medium').length,
        high: violations.filter(v => v.severity === 'high').length,
        critical: violations.filter(v => v.severity === 'critical').length
      },
      tabSwitches: violations.filter(v => v.type === 'tab_switch').length,
      timeSpentInactive: this.calculateInactiveTime(violations),
      suspiciousActivity: this.detectSuspiciousActivity(violations)
    };

    // Get device fingerprint
    const deviceKey = `device_fingerprint_${examId}_${studentId}`;
    const deviceFingerprint = localStorage.getItem(deviceKey) || '';

    return {
      examId,
      studentId,
      sessionId,
      violations,
      summary,
      deviceFingerprint,
      startTime,
      endTime: Date.now()
    };
  }

  /**
   * Convert security report to new submit format
   */
  convertToSubmitAllFormat(
    sessionId: string,
    answers: Record<string, any>,
    securityReport: SecurityReport,
    submissionType: 'manual' | 'auto_time' | 'auto_violation'
  ): SubmitExamAllRequest {
    // Convert violations to match backend ViolationLogItem schema
    const violations: ViolationLog[] = securityReport.violations.map((v, index) => ({
      violation_id: `${sessionId}_${index}_${Date.now()}`,
      type: v.type,
      severity: v.severity,
      timestamp: new Date(v.timestamp || Date.now()).toISOString(),
      context: {
        exam_id: v.examId,
        student_id: v.studentId,
        user_agent: v.userAgent,
        url: v.url,
        tab_active: v.tabActive,
        mouse_position: v.mousePosition,
        keyboard_stats: v.keyboardStats
      },
      auto_detected: true,
      details: typeof v.details === 'string' ? v.details : JSON.stringify(v.details)
    }));

    // Generate interaction logs from stored answer history
    const interactionLogs: InteractionLog[] = this.generateInteractionLogs(
      sessionId,
      answers
    );

    // Prepare client metadata
    const clientMetadata = {
      device_fingerprint: securityReport.deviceFingerprint,
      submission_type: submissionType,
      start_time: securityReport.startTime,
      end_time: securityReport.endTime,
      user_agent: navigator.userAgent,
      screen_resolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return {
      answers,
      interaction_logs: interactionLogs,
      violations,
      client_metadata: clientMetadata
    };
  }

  /**
   * Generate interaction logs from answer history
   */
  private generateInteractionLogs(
    sessionId: string,
    answers: Record<string, any>
  ): InteractionLog[] {
    const logs: InteractionLog[] = [];
    const currentTime = new Date().toISOString();

    // Get stored interaction logs if available
    const storedLogs = localStorage.getItem(`interaction_logs_${sessionId}`);
    if (storedLogs) {
      try {
        const parsedLogs = JSON.parse(storedLogs);
        return parsedLogs.map((log: any) => ({
          timestamp: log.timestamp || currentTime,
          question_id: log.question_id || log.questionId || '',
          displayed_position: log.displayed_position || log.position || 0,
          action: log.action || 'answer_submitted',
          student_answer: log.student_answer || log.answer
        }));
      } catch (error) {
        console.warn('Failed to parse stored interaction logs:', error);
      }
    }

    // Generate logs from current answers if no stored logs
    Object.entries(answers).forEach(([questionId, answer], index) => {
      logs.push({
        timestamp: currentTime,
        question_id: questionId,
        displayed_position: index + 1,
        action: 'answer_submitted',
        student_answer: typeof answer === 'string' ? answer : JSON.stringify(answer)
      });
    });

    return logs;
  }

  private calculateInactiveTime(violations: ViolationLog[]): number {
    let totalInactiveTime = 0;
    let lastBlurTime = 0;

    violations.forEach(violation => {
      // Handle both old (number) and new (string) timestamp formats
      const timestamp = typeof violation.timestamp === 'string' 
        ? new Date(violation.timestamp).getTime()
        : violation.timestamp || Date.now();
        
      if (violation.type === 'tab_switch') {
        lastBlurTime = timestamp;
      } else if (violation.type === 'tab_switch_return' && lastBlurTime > 0) {
        totalInactiveTime += timestamp - lastBlurTime;
        lastBlurTime = 0;
      }
    });

    return totalInactiveTime;
  }

  private detectSuspiciousActivity(violations: ViolationLog[]): boolean {
    // Define suspicious patterns
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;
    const rapidClicking = violations.filter(v => v.type === 'rapid_clicking').length;
    const rapidTyping = violations.filter(v => v.type === 'rapid_typing').length;
    const devToolsAttempts = violations.filter(v => v.type === 'devtools_detected').length;

    return criticalViolations > 0 || 
           highViolations > 5 || 
           rapidClicking > 2 || 
           rapidTyping > 2 || 
           devToolsAttempts > 0;
  }

  /**
   * Clean up security data after exam submission
   */
  cleanupSecurityData(examId: string, studentId: string): void {
    const keysToRemove = [
      `exam_violations_${examId}_${studentId}`,
      `session_violations_${examId}_${studentId}`,
      `device_fingerprint_${examId}_${studentId}`,
      `exam_session_${examId}_${studentId}`,
      `interaction_logs_${examId}`,
      // Also clean up any other exam-related data
      `exam_answers_${examId}_${studentId}`,
      `exam_questions_${examId}_${studentId}`,
      `exam_start_time_${examId}_${studentId}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear any cached exam data from memory
    try {
      // Force garbage collection if available (Chrome DevTools)
      if ((window as any).gc) {
        (window as any).gc();
      }
    } catch (error) {
      // Ignore if gc is not available
    }
    
    console.log('Security data cleaned up for exam:', examId);
  }
}

export const examSecurityService = new ExamSecurityService();