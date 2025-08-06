import { BaseService } from './base';

export interface ViolationLog {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  examId: string;
  studentId: string;
  details: any;
  userAgent: string;
  url: string;
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

export interface SubmitExamWithSecurityRequest {
  examId: string;
  sessionId: string;
  answers: Record<string, any>;
  securityReport: SecurityReport;
  submissionType: 'manual' | 'auto_time' | 'auto_violation';
}

class ExamSecurityService extends BaseService {
  /**
   * Submit exam answers along with security report
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

  private calculateInactiveTime(violations: ViolationLog[]): number {
    let totalInactiveTime = 0;
    let lastBlurTime = 0;

    violations.forEach(violation => {
      if (violation.type === 'tab_switch') {
        lastBlurTime = violation.timestamp;
      } else if (violation.type === 'tab_switch_return' && lastBlurTime > 0) {
        totalInactiveTime += violation.timestamp - lastBlurTime;
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
      `exam_session_${examId}_${studentId}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }
}

export const examSecurityService = new ExamSecurityService();