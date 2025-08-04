import { Amplify } from 'aws-amplify';

// Amplify configuration will be loaded when amplify_outputs.json is generated
// Run 'pnpm ampx sandbox' to generate this file
try {
  const outputs = require('@/amplify_outputs.json');
  Amplify.configure(outputs);
} catch (error) {
  console.warn('Amplify outputs not found. Run "pnpm ampx sandbox" to generate configuration.');
}