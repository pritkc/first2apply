// Debug logging for environment variables
console.log('🔧 Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '***' + process.env.SUPABASE_KEY.slice(-10) : 'undefined');
console.log('APP_BUNDLE_ID:', process.env.APP_BUNDLE_ID);

export const ENV = {
  nodeEnv: process.env.NODE_ENV,
  appBundleId: process.env.APP_BUNDLE_ID,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  mezmoApiKey: process.env.MEZMO_API_KEY,
  amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
};
