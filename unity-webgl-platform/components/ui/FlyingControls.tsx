'use client'

interface FlyingControlsProps {
  className?: string
}

export default function FlyingControls({ className = '' }: FlyingControlsProps) {
  return (
    <div className={`bg-gradient-to-br from-gray-900/40 to-gray-800/30 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/20 shadow-2xl ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-gray-300">
          FLYING CONTROLS
        </span>
      </h2>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Movement Controls */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-orange-400 text-sm font-medium mb-3">Forward</h3>
            <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-3 text-white font-bold text-lg">
              W
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Turn Left</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                Q
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Reverse</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                S
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Turn Right</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                E
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Strafe Left</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                A
              </div>
            </div>
            <div></div>
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Strafe Right</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                D
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Primary Actions */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-orange-400 text-sm font-medium mb-3">Ascend</h3>
            <div className="bg-orange-500/30 border-2 border-orange-500/60 rounded-lg p-4 text-white font-bold text-lg">
              Space Bar
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-orange-400 text-sm font-medium mb-3">Descend</h3>
            <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-3 text-white font-bold text-lg">
              V
            </div>
          </div>
        </div>

        {/* Right Column - Camera Controls */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-orange-400 text-sm font-medium mb-3">Slew FPV Camera</h3>
            <div className="bg-gray-700/40 border border-gray-600/60 rounded-lg p-3 text-white font-bold">
              ↑
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-700/40 border border-gray-600/60 rounded-lg p-2 text-white font-bold text-center">
              ←
            </div>
            <div className="bg-gray-700/40 border border-gray-600/60 rounded-lg p-2 text-white font-bold text-center">
              ↓
            </div>
            <div className="bg-gray-700/40 border border-gray-600/60 rounded-lg p-2 text-white font-bold text-center">
              →
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Note */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        Click the browser window to ensure it receives your commands
      </div>
    </div>
  )
}