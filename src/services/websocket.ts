class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
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
  
  connect(
    token: string, 
    endpointSuffix: string = '/ws/lobby', 
    onAuthError?: () => void, 
    onStatusChange?: (status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => void
  ) {
    const newWsUrl = `wss://testing.cigarverse.space/api/v1${endpointSuffix}?token=${token}`;

    // If already connected or connecting to the same URL, skip
    if (this.ws && 
        (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && 
        this.currentWsUrl === newWsUrl) {
      console.log('WebSocketService: Already connected or connecting to this URL, skipping.', {
        currentUrl: this.currentWsUrl,
        newUrl: newWsUrl,
        readyState: this.ws.readyState
      });
      return;
    }

    // If reconnecting to the same URL, don't start new connection
    if (this.isReconnecting && this.currentWsUrl === newWsUrl) {
      console.log('WebSocketService: Reconnect attempt already in progress for this URL.', {
        currentUrl: this.currentWsUrl,
        newUrl: newWsUrl
      });
      return;
    }

    // If there's a different active connection, close it first
    if (this.ws && 
        (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && 
        this.currentWsUrl !== newWsUrl) {
      console.log('WebSocketService: Closing existing connection to different URL.', {
        currentUrl: this.currentWsUrl,
        newUrl: newWsUrl
      });
      this.ws.close();
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
      this.authErrorCallback = onAuthError || null;
      this.statusChangeCallback = onStatusChange || null;
      this.currentWsUrl = newWsUrl;
      
      console.log('WebSocketService: Attempting to connect to:', {
        url: newWsUrl,
        endpoint: endpointSuffix
      });
      
      this.ws = new WebSocket(newWsUrl);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.statusChangeCallback?.('connected');
        console.log('WebSocketService: Successfully connected to:', {
          url: newWsUrl,
          endpoint: endpointSuffix
        });
        
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
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocketService: Connection closed.', {
          code: event.code,
          reason: event.reason,
          url: this.currentWsUrl,
          endpoint: this.currentEndpoint
        });
        
        // Handle authentication errors
        if (event.code === 1008) {
          console.error('WebSocket authentication failed');
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
        console.error('WebSocketService: Connection error:', {
          error,
          url: this.currentWsUrl,
          endpoint: this.currentEndpoint
        });
        this.statusChangeCallback?.('error');
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', {
        error,
        url: newWsUrl,
        endpoint: endpointSuffix
      });
      this.statusChangeCallback?.('error');
      this.isReconnecting = false;
    }
  }

  private attemptReconnect() {
    // Don't reconnect if we don't have the necessary information
    if (!this.currentToken || !this.currentEndpoint) {
      console.log('WebSocketService: Cannot reconnect - missing token or endpoint');
      this.isReconnecting = false;
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.isReconnecting = true;
      
      this.statusChangeCallback?.('reconnecting');
      console.log(`WebSocketService: Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`, {
        endpoint: this.currentEndpoint,
        url: this.currentWsUrl
      });
      
      this.reconnectTimeoutId = setTimeout(() => {
        // Double-check that we still need to reconnect
        if (this.currentToken && this.currentEndpoint && this.isReconnecting) {
          this.connect(this.currentToken, this.currentEndpoint, this.authErrorCallback || undefined, this.statusChangeCallback || undefined);
        }
      }, Math.min(this.reconnectInterval * this.reconnectAttempts, 10000)); // Cap at 10 seconds
    } else {
      console.error('WebSocketService: Max reconnection attempts reached', {
        attempts: this.reconnectAttempts,
        endpoint: this.currentEndpoint
      });
      this.statusChangeCallback?.('error');
      this.isReconnecting = false;
    }
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
      queuedMessages: this.messageQueue.length
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
    console.log('WebSocketService: Manual disconnect requested', {
      currentUrl: this.currentWsUrl,
      endpoint: this.currentEndpoint,
      readyState: this.ws?.readyState
    });

    // Clear any pending reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Only close if there's an active WebSocket instance
    if (this.ws) {
      // Check if WebSocket is open or connecting before closing
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        console.log('WebSocketService: Closing WebSocket connection');
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
    
    console.log('WebSocketService: Disconnect completed, all state cleared');
  }
}

export const websocketService = new WebSocketService();