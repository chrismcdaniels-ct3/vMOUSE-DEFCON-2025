// Unity-React communication bridge
export interface UnityMessage {
  type: string
  data: any
}

export class UnityBridge {
  private unityInstance: any
  private messageHandlers: Map<string, (data: any) => void> = new Map()

  constructor(unityInstance: any) {
    this.unityInstance = unityInstance
    
    // Expose global function for Unity to call React
    if (typeof window !== 'undefined') {
      (window as any).ReactBridge = {
        sendMessage: this.handleUnityMessage.bind(this)
      }
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
      delete (window as any).ReactBridge
    }
  }
}