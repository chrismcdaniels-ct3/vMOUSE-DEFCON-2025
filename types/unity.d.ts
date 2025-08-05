export interface UnityConfig {
  dataUrl?: string
  frameworkUrl: string
  codeUrl: string
  symbolsUrl?: string
  streamingAssetsUrl?: string
  companyName?: string
  productName?: string
  productVersion?: string
  loaderUrl?: string
}

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: UnityConfig,
      onProgress?: (progress: number) => void
    ) => Promise<any>
  }
}

export {}