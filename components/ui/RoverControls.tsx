'use client'

interface RoverControlsProps {
  className?: string
}

export default function RoverControls({ className = '' }: RoverControlsProps) {
  return (
    <div className={`bg-gradient-to-br from-gray-900/40 to-gray-800/30 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/20 shadow-2xl ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-gray-300">
          DRIVING CONTROLS
        </span>
      </h2>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Movement Controls */}
        <div className="space-y-4">
          {/* Top row: W for Forward */}
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Forward</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                W
              </div>
            </div>
            <div></div>
          </div>
          
          {/* Bottom row: A S D */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Left</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                A
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Reverse</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                S
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-orange-400 text-xs mb-2">Right</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                D
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Primary Actions */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-orange-400 text-sm font-medium mb-3">Break</h3>
            <div className="bg-orange-500/30 border-2 border-orange-500/60 rounded-lg p-4 text-white font-bold text-lg w-full min-w-[200px]">
              Space Bar
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="text-center w-16">
              <h4 className="text-orange-400 text-xs mb-2">Small Hop If Stuck</h4>
              <div className="bg-gray-600/30 border border-gray-500/50 rounded-lg p-2 text-white font-bold">
                H
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Camera Controls */}
        <div className="space-y-4">
          <h3 className="text-orange-400 text-sm font-medium mb-3 text-center">Slew FPV Camera</h3>
          
          {/* Top row: Up arrow centered */}
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <div className="bg-gray-700/40 border border-gray-600/60 rounded-lg p-2 text-white font-bold text-center">
              ↑
            </div>
            <div></div>
          </div>
          
          {/* Bottom row: Left, Down, Right */}
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