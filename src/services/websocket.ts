import { API_BASE_URL } from '../constants/config';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Number.MAX_SAFE_INTEGER; // No limit on reconnect attempts
  private reconnectInterval = 5000; // 5 seconds for first attempt
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private messageQueue: any[] = [];
  private statusChangeCallback: ((status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => void) | null = null;
  private authErrorCallback: (() => void) | null = null;
  private genericHandler: ((data: any) => void) | null = null;
  private currentToken: string | null = null;
  private currentEndpoint: string | null = null;
  private currentWsUrl: string | null = null;
  private isReconnecting: boolean = false;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  
  // Heartbeat related properties
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private heartbeatInterval = 50000; // 50 seconds as per requirements
  private lastHeartbeatAck: number = 0;
  private userId: string | null = null;
  private userRole: string | null = null;

  getCurrentEndpoint(): string | null {
    return this.currentEndpoint;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  
  getConnectionState(): {
    readyState: number | undefined;
    endpoint: string | null;
    url: string | null;
    isReconnecting: boolean;
  } {
    return {
      readyState: this.ws?.readyState,
      endpoint: this.currentEndpoint,
      url: this.currentWsUrl,
      isReconnecting: this.isReconnecting
    };
  }
  
  // Set user information for heartbeat messages
  setUserInfo(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
  }
  
  // Start heartbeat mechanism
  private startHeartbeat() {
    // Clear any existing heartbeat interval
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    
    // Start sending heartbeat every 50 seconds
    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeatMessage = {
          type: "heartbeat",
          timestamp: Date.now(),
          message_id: `hb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: this.userId,
          user_role: this.userRole
        };
        
        console.log('💓 Heartbeat sent:', this.currentEndpoint);
        this.send(heartbeatMessage);
      }
    }, this.heartbeatInterval);
  }
  
  // Stop heartbeat mechanism
  private stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }
  
  // Handle server ping messages
  private handleServerPing(data: any) {
    if (data.type === "heartbeat_ping" && data.timestamp) {
      console.log('🏓 Server ping received, sending pong');
      
      const pongMessage = {
        type: "heartbeat_pong",
        timestamp: data.timestamp,
        server_time: Date.now(),
        message_id: `pong_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: this.userId,
        user_role: this.userRole
      };
      
      this.send(pongMessage);
    }
  }
  
  // Handle heartbeat acknowledgment
  private handleHeartbeatAck(data: any) {
    if (data.type === "heartbeat_ack") {
      this.lastHeartbeatAck = Date.now();
      console.log('💓 Heartbeat acknowledged');
    }
  }

  connect(
    token: string, 
    endpointSuffix: string = '/ws/lobby', 
    onAuthError?: () => void, 
    onStatusChange?: (status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => void
  ) {
    console.log('🔍 WebSocketService - connect() called with endpointSuffix:', endpointSuffix);
    console.log('🔍 WebSocketService - token length:', token ? token.length : 'null');
    
    // Extract base domain from API_BASE_URL and construct proper WebSocket URL
    const baseUrl = API_BASE_URL; // https://testing.cigarverse.space/api/v1
    console.log('🔍 WebSocketService - baseURL from service:', baseUrl);
    
    // Extract domain from baseURL (remove /api/v1 suffix)
    const urlParts = baseUrl.replace('https://', '').replace('http://', '').split('/');
    const domain = urlParts[0]; // testing.cigarverse.space
    console.log('🔍 WebSocketService - extracted domain:', domain);
    
    // Ensure endpointSuffix starts with /
    const cleanEndpointSuffix = endpointSuffix.startsWith('/') ? endpointSuffix : `/ws/exam-room/${endpointSuffix}`;
    console.log('🔍 WebSocketService - cleanEndpointSuffix:', cleanEndpointSuffix);
    
    // Build proper WebSocket URL: wss://domain/api/v1/ws/...
    const newWsUrl = `wss://${domain}/api/v1${cleanEndpointSuffix}?token=${token}`;
    console.log('🔍 WebSocketService - newWsUrl constructed:', newWsUrl);

    // If already connected or connecting to the same URL, skip
    if (this.ws && 
        (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && 
        this.currentWsUrl === newWsUrl) {
      console.log('🔍 WebSocketService - Already connected to same URL, skipping connection');
      return;
    }

    // If reconnecting to the same URL, don't start new connection - let existing reconnect handle it
    if (this.isReconnecting && this.currentWsUrl === newWsUrl) {
      console.log('🔍 WebSocketService - Already reconnecting to same URL, skipping');
      return;
    }

    // If there's an existing connection that needs to be closed
    if (this.ws && this.currentWsUrl !== newWsUrl) {
      console.log('🔍 WebSocketService - Closing existing connection. Old URL:', this.currentWsUrl, 'New URL:', newWsUrl);
      const readyState = this.ws.readyState;
      
      // Close connection if it's open, connecting, or in any state other than closed
      if (readyState !== WebSocket.CLOSED) {
        try {
          this.ws.close();
        } catch (error) {
        }
      }
      this.ws = null;
    }

    // Clear any pending reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    try {
      this.currentToken = token;
      this.currentEndpoint = endpointSuffix;
      console.log('🔍 WebSocketService - Setting currentEndpoint to:', endpointSuffix);
      this.authErrorCallback = onAuthError || null;
      this.statusChangeCallback = onStatusChange || null;
      this.currentWsUrl = newWsUrl;
      console.log('🔍 WebSocketService - Setting currentWsUrl to:', newWsUrl);
      
      this.ws = new WebSocket(newWsUrl);
      console.log('🔍 WebSocketService - WebSocket instance created for URL:', newWsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected:', this.currentEndpoint);
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.statusChangeCallback?.('connected');
        
        // Start heartbeat mechanism
        this.startHeartbeat();
        
        // Expose debug methods in development
        this.exposeDebugMethods();
        
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('Received WebSocket message:', data);
          
          // Handle heartbeat messages
          this.handleHeartbeatAck(data);
          this.handleServerPing(data);
          
          // Call generic handler first if exists
          if (this.genericHandler) {
            this.genericHandler(data);
          }
          
          // Check for both 'type' and 'messageType' fields for backward compatibility
          const messageType = data.type || data.messageType;
          
          // Call registered handlers
          if (messageType && this.messageHandlers.has(messageType)) {
            const handler = this.messageHandlers.get(messageType);
            if (handler) {
              handler(data);
            }
          }
          
          // Call catch-all handler
          if (this.messageHandlers.has('*')) {
            const genericRegisteredHandler = this.messageHandlers.get('*');
            if (genericRegisteredHandler) {
              genericRegisteredHandler(data);
            }
          }
        } catch (error) {
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔍 WebSocketService - WebSocket connection closed. Code:', event.code, 'Reason:', event.reason, 'URL:', this.currentWsUrl);
        // Stop heartbeat when connection closes
        this.stopHeartbeat();
        
        // Handle authentication errors
        if (event.code === 1008) {
          console.log('🔍 WebSocketService - Authentication error detected (code 1008)');
          this.isReconnecting = false;
          this.authErrorCallback?.();
          return;
        }
        
        // Only call attemptReconnect if not already reconnecting
        if (!this.isReconnecting) {
          this.statusChangeCallback?.('disconnected');
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.log('🔍 WebSocketService - WebSocket error occurred:', error, 'URL:', this.currentWsUrl);
        this.statusChangeCallback?.('error');
      };
    } catch (error) {
      console.log('🔍 WebSocketService - Exception during WebSocket creation:', error);
      this.statusChangeCallback?.('error');
      this.isReconnecting = false;
    }
  }

  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
  
  private attemptReconnect() {
    // Don't reconnect if we don't have the necessary information
    if (!this.currentToken || !this.currentEndpoint) {
      this.isReconnecting = false;
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Always attempt to reconnect (no limit)
    if (true) {
      this.reconnectAttempts++;
      
      // Set isReconnecting to true for this attempt
      this.isReconnecting = true;
      
      this.statusChangeCallback?.('reconnecting');
      
      // Exponential backoff with max delay of 30 seconds
      const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      this.reconnectTimeoutId = setTimeout(() => {
        // Double-check that we still need to reconnect and not already connected
        if (this.currentToken && this.currentEndpoint && this.isReconnecting && 
            (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
          this.connect(this.currentToken, this.currentEndpoint, this.authErrorCallback || undefined, this.statusChangeCallback || undefined);
        } else {
          this.isReconnecting = false;
        }
      }, delay);
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  setGenericHandler(handler: (data: any) => void) {
    this.genericHandler = handler;
  }

  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  getConnectionInfo() {
    return {
      url: this.currentWsUrl,
      endpoint: this.currentEndpoint,
      readyState: this.ws?.readyState,
      registeredHandlers: Array.from(this.messageHandlers.keys()),
      hasGenericHandler: !!this.genericHandler,
      queuedMessages: this.messageQueue.length,
      lastHeartbeatAck: this.lastHeartbeatAck
    };
  }

  // Debug method to manually trigger test messages
  sendTestMessage(type: string, data: any = {}) {
    const testMessage = {
      type: type,
      timestamp: Date.now(),
      test: true,
      ...data
    };
    
    this.send(testMessage);
  }

  // Get current connection state for debugging
  exposeDebugMethods() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).wsDebug = {
        getInfo: () => this.getConnectionInfo(),
        sendTest: (type: string, data?: any) => this.sendTestMessage(type, data),
        isConnected: () => this.isConnected(),
        getConnectionState: () => this.getConnectionState(),
        forceDisconnect: () => this.disconnect(),
        forceReconnect: () => {
          if (this.currentToken && this.currentEndpoint) {
            this.disconnect();
            setTimeout(() => {
              this.connect(this.currentToken!, this.currentEndpoint!, this.authErrorCallback || undefined, this.statusChangeCallback || undefined);
            }, 1000);
          }
        },
        sendViolation: (violationType: string, severity: string = 'medium') => {
          this.sendTestMessage('violation_event', {
            violation_type: violationType,
            severity: severity,
            studentId: 'test-student',
            examId: 'test-exam',
            sessionId: 'test-session',
            details: { test: true }
          });
        },
        sendActivity: (activityType: string) => {
          this.sendTestMessage('activity_event', {
            activityType: activityType,
            studentId: 'test-student',
            examId: 'test-exam',
            sessionId: 'test-session',
            details: { test: true }
          });
        }
      };
    }
  }

  disconnect() {
    // Stop heartbeat
    this.stopHeartbeat();

    // Clear any pending reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Only close if there's an active WebSocket instance
    if (this.ws) {
      // Check if WebSocket is open or connecting before closing
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    
    // Clear all state regardless of connection status
    this.messageQueue = [];
    this.messageHandlers.clear();
    this.genericHandler = null;
    this.statusChangeCallback = null;
    this.authErrorCallback = null;
    this.currentToken = null;
    this.currentEndpoint = null;
    this.currentWsUrl = null;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.lastHeartbeatAck = 0;
  }
}

export const websocketService = new WebSocketService();