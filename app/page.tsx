'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-orange-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/10 via-transparent to-transparent" />
        
        {/* Animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600 rounded-full filter blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 animate-pulse animation-delay-2000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Logo and title */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-7xl md:text-8xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-gray-400">
              DEFCON
            </span>
          </h1>
          <div className="mt-4 h-1 w-32 bg-gradient-to-r from-orange-400 to-gray-400 mx-auto rounded-full" />
        </div>

        {/* Game cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
          {/* vMOUSE Card */}
          <Link href="/unity/vmouse" className="group">
            <div 
              className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-orange-500/20 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-orange-500/25 hover:border-orange-400/40"
              style={{
                transform: typeof window !== 'undefined' 
                  ? `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) * 0.01}deg) rotateX(${-(mousePosition.y - window.innerHeight / 2) * 0.01}deg)`
                  : 'perspective(1000px)'
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Image */}
              <div className="relative h-64 w-full mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-600/20 to-gray-800/20">
                <Image
                  src="/mouse-drone.png"
                  alt="vMOUSE Drone"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
              
              {/* Content */}
              <div className="relative">
                <h2 className="text-4xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                  vMOUSE Drone
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors">
                  Experience precision drone piloting in immersive virtual environments
                </p>
                
                {/* Features */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30">
                    Real-time
                  </span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30">
                    3D Graphics
                  </span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30">
                    Precision Control
                  </span>
                </div>
                
                {/* Arrow indicator */}
                <div className="mt-6 flex items-center text-orange-400 group-hover:text-orange-300 transition-colors">
                  <span className="text-sm font-medium">Launch Game</span>
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* vROVER Card */}
          <Link href="/unity/vrover" className="group">
            <div 
              className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-orange-500/20 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-orange-500/25 hover:border-orange-400/40"
              style={{
                transform: typeof window !== 'undefined' 
                  ? `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) * 0.01}deg) rotateX(${-(mousePosition.y - window.innerHeight / 2) * 0.01}deg)`
                  : 'perspective(1000px)'
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Image */}
              <div className="relative h-64 w-full mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-600/20 to-gray-800/20">
                <Image
                  src="/mouse-rover.png"
                  alt="vMOUSE Rover"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
              
              {/* Content */}
              <div className="relative">
                <h2 className="text-4xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                  vMOUSE Rover
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors">
                  Navigate challenging terrains with advanced rover control systems
                </p>
                
                {/* Features */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30">
                    Physics-based
                  </span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30">
                    Terrain Mapping
                  </span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30">
                    Missions
                  </span>
                </div>
                
                {/* Arrow indicator */}
                <div className="mt-6 flex items-center text-orange-400 group-hover:text-orange-300 transition-colors">
                  <span className="text-sm font-medium">Launch Game</span>
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center animate-fade-in animation-delay-1000">
          <p className="text-gray-500 text-sm">
            © 2025 CT Cubed Inc
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Developed by the experts at CT Cubed Inc. Interested in custom training? Let's talk.
          </p>
          {/* Hidden admin link - keyboard shortcut: Ctrl+Shift+A */}
          <Link 
            href="/admin" 
            className="inline-block mt-4 text-gray-900 hover:text-gray-800 text-xs opacity-0 hover:opacity-10 transition-opacity"
            aria-hidden="true"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}