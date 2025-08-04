const http = require('http');

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testUnityLoading() {
  console.log('Testing Unity WebGL loading...\n');
  
  try {
    // Test the React app
    console.log('1. Testing React app at http://localhost:3000/test-vmouse');
    const reactResponse = await fetchPage('http://localhost:3000/test-vmouse');
    
    if (reactResponse.status === 200) {
      console.log('✓ Page loaded successfully');
      
      // Check for Unity canvas
      if (reactResponse.data.includes('id="unity-canvas"')) {
        console.log('✓ Unity canvas element found');
      } else {
        console.log('✗ Unity canvas element not found');
      }
      
      // Check for loader script
      if (reactResponse.data.includes('defcon_vmouse.loader.js')) {
        console.log('✓ Unity loader script reference found');
      } else {
        console.log('✗ Unity loader script reference not found');
      }
      
      // Check for error messages
      if (reactResponse.data.includes('Failed to load Unity')) {
        console.log('✗ Error message found in page');
      } else {
        console.log('✓ No error messages found');
      }
      
      // Check what build path is being used
      const buildPathMatch = reactResponse.data.match(/\/unity-builds\/[^"']+/);
      if (buildPathMatch) {
        console.log(`✓ Build path: ${buildPathMatch[0]}`);
      }
    } else {
      console.log(`✗ Page returned status ${reactResponse.status}`);
    }
    
    // Test if Unity files are accessible
    console.log('\n2. Testing Unity file accessibility');
    const unityFiles = [
      '/unity-builds/defcon_vmouse/Build/defcon_vmouse.loader.js',
      '/unity-builds/defcon_vmouse/Build/defcon_vmouse.framework.js',
      '/unity-builds/defcon_vmouse/Build/defcon_vmouse.wasm'
    ];
    
    for (const file of unityFiles) {
      try {
        const response = await fetchPage(`http://localhost:3000${file}`);
        if (response.status === 200) {
          console.log(`✓ ${file} is accessible`);
        } else {
          console.log(`✗ ${file} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`✗ ${file} failed: ${error.message}`);
      }
    }
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testUnityLoading();