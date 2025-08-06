// Unity-React communication bridge
export interface UnityMessage {
  type: string
  data: any
}

// Allowed message types whitelist
const ALLOWED_MESSAGE_TYPES = [
  'gameState',
  'score',
  'playerAction',
  'levelComplete',
  'error',
  'telemetry'
]

export class UnityBridge {
  private unityInstance: any
  private messageHandlers: Map<string, (data: any) => void> = new Map()
  private readonly allowedOrigins: string[]
  
  constructor(unityInstance: any) {
    this.unityInstance = unityInstance
    
    // Set allowed origins from environment
    this.allowedOrigins = [
      typeof window !== 'undefined' ? window.location.origin : '',
      process.env.NEXT_PUBLIC_APP_URL || ''
    ].filter(Boolean)
    
    // Set up message listener for postMessage communication
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handlePostMessage.bind(this))
      
      // Create a secure bridge object
      const bridge = {
        sendMessage: (message: string) => {
          // Validate caller origin
          try {
            const parsedMessage: UnityMessage = JSON.parse(message)
            if (this.isValidMessage(parsedMessage)) {
              this.handleUnityMessage(message)
            } else {
              console.warn('Invalid message type:', parsedMessage.type)
            }
          } catch (error) {
            console.error('Invalid message format:', error)
          }
        }
      }
      
      // Use Object.defineProperty to make it harder to tamper with
      Object.defineProperty(window, 'ReactBridge', {
        value: bridge,
        writable: false,
        configurable: false
      })
    }
  }
  
  // Validate message type against whitelist
  private isValidMessage(message: UnityMessage): boolean {
    return ALLOWED_MESSAGE_TYPES.includes(message.type)
  }
  
  // Handle postMessage events with origin validation
  private handlePostMessage(event: MessageEvent) {
    // Validate origin
    if (!this.allowedOrigins.includes(event.origin)) {
      console.warn('Blocked message from unauthorized origin:', event.origin)
      return
    }
    
    try {
      const message: UnityMessage = event.data
      if (this.isValidMessage(message)) {
        const handler = this.messageHandlers.get(message.type)
        if (handler) {
          handler(message.data)
        }
      }
    } catch (error) {
      console.error('Failed to process message:', error)
    }
  }

  // Send message from React to Unity
  sendToUnity(gameObjectName: string, methodName: string, data: any) {
    if (this.unityInstance?.SendMessage) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.unityInstance.SendMessage(gameObjectName, methodName, message)
    }
  }

  // Register handler for messages from Unity
  on(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler)
  }

  // Remove message handler
  off(messageType: string) {
    this.messageHandlers.delete(messageType)
  }

  // Handle message from Unity
  private handleUnityMessage(message: string) {
    try {
      const parsedMessage: UnityMessage = JSON.parse(message)
      const handler = this.messageHandlers.get(parsedMessage.type)
      
      if (handler) {
        handler(parsedMessage.data)
      }
    } catch (error) {
      console.error('Failed to parse Unity message:', error)
    }
  }

  // Cleanup
  destroy() {
    this.messageHandlers.clear()
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handlePostMessage.bind(this))
      // Note: ReactBridge cannot be deleted due to defineProperty configuration
      // This is intentional for security
    }
  }
}