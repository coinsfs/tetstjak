class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private messageQueue: any[] = [];
  private statusChangeCallback: ((status: 'connected' | 'disconnected' | 'error') => void) | null = null;
  private authErrorCallback: (() => void) | null = null;
  private genericHandler: ((data: any) => void) | null = null;
  private currentToken: string | null = null;
  private currentEndpoint: string | null = null;
  private currentWsUrl: string | null = null;
  private isReconnecting: boolean = false;

  getCurrentEndpoint(): string | null {
    return this.currentEndpoint;
  }

  
  connect(
    token: string, 
    endpointSuffix: string = '/ws/lobby', 
    onAuthError?: () => void, 
    onStatusChange?: (status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => void
  ) {
    const newWsUrl = `wss://testing.cigarverse.space/api/v1${endpointSuffix}?token=${token}`;

    // Jika sudah terhubung atau sedang terhubung ke URL yang sama, jangan lakukan apa-apa
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && this.currentWsUrl === newWsUrl) {
      console.log('WebSocketService: Already connected or connecting to this URL, skipping.');
      return;
    }

    // Jika sedang dalam proses reconnect, jangan mulai koneksi baru dari luar
    if (this.isReconnecting && this.currentWsUrl === newWsUrl) {
      console.log('WebSocketService: Reconnect attempt already in progress for this URL.');
      return;
    }

    // Jika ada koneksi berbeda yang aktif, tutup dulu
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && this.currentWsUrl !== newWsUrl) {
      console.log('WebSocketService: Closing existing connection to different URL.');
      this.ws.close(); // Tutup koneksi yang ada
      this.ws = null;
    }

    try {
      this.currentToken = token;
      this.currentEndpoint = endpointSuffix;
      this.authErrorCallback = onAuthError || null;
      this.statusChangeCallback = onStatusChange || null;
      this.currentWsUrl = newWsUrl; // Simpan URL baru
      this.isReconnecting = false; // Reset flag saat memulai koneksi baru
      
      console.log('WebSocketService: Attempting to connect to:', newWsUrl);
      
      this.ws = new WebSocket(newWsUrl);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.isReconnecting = false; // Reset flag saat koneksi berhasil
        this.statusChangeCallback?.('connected');
        console.log('WebSocketService: Successfully connected to:', newWsUrl);
        
        // Expose debug methods in development
        this.exposeDebugMethods();
        
        // Kirim pesan yang mengantri
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
          
          // Panggil handler yang terdaftar
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
        console.log('WebSocketService: Connection closed. Code:', event.code, 'Reason:', event.reason);
        
        // Tangani kesalahan autentikasi
        if (event.code === 1008) {
          console.error('WebSocket authentication failed');
          this.isReconnecting = false; // Reset flag saat auth error
          this.authErrorCallback?.();
          return;
        }
        
        // Hanya panggil attemptReconnect jika tidak sedang dalam proses reconnect
        if (!this.isReconnecting) {
          this.statusChangeCallback?.('disconnected');
        }
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocketService: Connection error:', error);
        this.statusChangeCallback?.('error');
        this.isReconnecting = false; // Reset flag saat terjadi error
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.statusChangeCallback?.('error');
      this.isReconnecting = false; // Reset flag saat terjadi error
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.isReconnecting = true; // Set flag saat memulai upaya reconnect
      
      this.statusChangeCallback?.('reconnecting'); // Laporkan status 'reconnecting'
      console.log(`WebSocketService: Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this.currentToken && this.currentEndpoint) {
          this.connect(this.currentToken, this.currentEndpoint, this.authErrorCallback || undefined, this.statusChangeCallback || undefined);
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.statusChangeCallback?.('error');
      this.isReconnecting = false; // Reset flag jika upaya reconnect gagal
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
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Expose debugging methods globally in development
  exposeDebugMethods() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).wsDebug = {
        getInfo: () => this.getConnectionInfo(),
        sendTest: (type: string, data?: any) => this.sendTestMessage(type, data),
        isConnected: () => this.isConnected(),
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
    // Hanya tutup jika ada instance WebSocket yang aktif
    if (this.ws) {
      // Periksa apakah WebSocket terbuka atau sedang terhubung sebelum menutup
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        console.log('WebSocketService: Manually disconnecting WebSocket');
        this.ws.close();
      }
      this.ws = null; // Selalu kosongkan referensi
    }
    // Hapus state lain terlepas dari status koneksi
    this.messageQueue = [];
    this.statusChangeCallback = null;
    this.authErrorCallback = null;
    this.currentToken = null;
    this.currentEndpoint = null;
    this.currentWsUrl = null;
    this.isReconnecting = false; // Pastikan flag direset saat disconnect manual
  }
}

export const websocketService = new WebSocketService();
