import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-white mb-2">
          DEF CON Unity Platform
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Select your game mode
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/unity/vmouse"
            className="group relative px-12 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">vMOUSE</h2>
              <p className="text-blue-100">Pilot drones in virtual environments</p>
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          </Link>
          
          <Link
            href="/unity/vrover"
            className="group relative px-12 py-8 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">vROVER</h2>
              <p className="text-green-100">Control rovers in challenging terrain</p>
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          </Link>
        </div>
        
        <div className="mt-16">
          <p className="text-gray-400 text-sm">
            Built for DEF CON • Unity WebGL Platform
          </p>
        </div>
      </div>
    </div>
  )
}