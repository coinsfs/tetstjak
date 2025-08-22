class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private messageQueue: any[] = [];
  private statusChangeCallback: ((status: 'connected' | 'disconnected' | 'error') => void) | null = null;
  private authErrorCallback: (() => void) | null = null;
  private currentToken: string | null = null;
  private currentEndpoint: string | null = null;

  connect(
    token: string, 
    endpointSuffix: string = '/ws/lobby', 
    onAuthError?: () => void, 
    onStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void
  ) {
    try {
      this.currentToken = token;
      this.currentEndpoint = endpointSuffix;
      this.authErrorCallback = onAuthError || null;
      this.statusChangeCallback = onStatusChange || null;
      
      const wsUrl = `ws://54.179.214.145//api/v1${endpointSuffix}?token=${token}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.statusChangeCallback?.('connected');
        
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
          console.log('WebSocket message received:', data);
          
          // Call registered handlers
          if (data.type && this.messageHandlers.has(data.type)) {
            const handler = this.messageHandlers.get(data.type);
            if (handler) {
              handler(data);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.reason);
        this.statusChangeCallback?.('disconnected');
        
        // Handle authentication errors
        if (event.code === 1008) {
          console.error('WebSocket authentication failed');
          this.authErrorCallback?.();
          return;
        }
        
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.statusChangeCallback?.('error');
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.statusChangeCallback?.('error');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.statusChangeCallback?.('disconnected');
      
      setTimeout(() => {
        if (this.currentToken && this.currentEndpoint) {
          this.connect(this.currentToken, this.currentEndpoint, this.authErrorCallback || undefined, this.statusChangeCallback || undefined);
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.statusChangeCallback?.('error');
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, queuing message');
      this.messageQueue.push(message);
    }
  }

  disconnect() {
    this.messageQueue = [];
    this.statusChangeCallback = null;
    this.authErrorCallback = null;
    this.currentToken = null;
    this.currentEndpoint = null;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const websocketService = new WebSocketService();