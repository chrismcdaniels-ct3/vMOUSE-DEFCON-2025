'use client'

import { useEffect } from 'react'

export default function TestUnityGzPage() {
  useEffect(() => {
    async function testUrls() {
      const urls = [
        '/api/unity-gz/Build/defcon_drone.loader.js',
        '/api/unity-gz/Build/defcon_drone.data.gz',
        '/api/unity-gz/Build/defcon_drone.framework.js.gz',
        '/api/unity-gz/Build/defcon_drone.wasm.gz',
      ]
      
      for (const url of urls) {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          console.log(`${url}: ${response.status} ${response.ok ? '✓' : '✗'}`)
          console.log('Headers:', Object.fromEntries(response.headers.entries()))
        } catch (error) {
          console.error(`${url}: Error -`, error)
        }
      }
    }
    
    testUrls()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Unity GZ API Test</h1>
      <p>Check the browser console for results</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Direct Links:</h2>
        <ul className="space-y-2">
          <li><a href="/api/unity-gz/Build/defcon_drone.loader.js" className="text-blue-600 hover:underline">/api/unity-gz/Build/defcon_drone.loader.js</a></li>
          <li><a href="/api/unity-gz/Build/defcon_drone.data.gz" className="text-blue-600 hover:underline">/api/unity-gz/Build/defcon_drone.data.gz</a></li>
          <li><a href="/api/unity-gz/Build/defcon_drone.framework.js.gz" className="text-blue-600 hover:underline">/api/unity-gz/Build/defcon_drone.framework.js.gz</a></li>
          <li><a href="/api/unity-gz/Build/defcon_drone.wasm.gz" className="text-blue-600 hover:underline">/api/unity-gz/Build/defcon_drone.wasm.gz</a></li>
        </ul>
      </div>
    </div>
  )
}