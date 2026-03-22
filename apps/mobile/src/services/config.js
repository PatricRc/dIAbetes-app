// Central config — all API keys read from EXPO_PUBLIC_ env vars
// which Expo automatically inlines at build time

function readEnv(name) {
  const value = process.env[name];

  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().replace(/^['"]|['"]$/g, '');
}

export const CONFIG = {
  gemini: {
    apiKey: readEnv('EXPO_PUBLIC_GEMINI_API_KEY'),
    embeddingModel: 'gemini-embedding-2-preview',
    visionModel: 'gemini-2.0-flash',
    embeddingDims: 768, // MRL truncation — fast + cost-effective for demo
  },
  pinecone: {
    apiKey: readEnv('EXPO_PUBLIC_PINECONE_API_KEY'),
    indexHost: readEnv('EXPO_PUBLIC_PINECONE_INDEX_HOST'),
    indexName: readEnv('EXPO_PUBLIC_PINECONE_INDEX_NAME') || 'diabetes-guardian',
    topK: 8,
  },
  openai: {
    apiKey: readEnv('EXPO_PUBLIC_OPENAI_API_KEY'),
    visionModel: 'gpt-4.1-mini',
    transcriptionModel: 'gpt-4o-transcribe',
    reasoningModel: 'gpt-4o',
  },
  supabase: {
    url: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
    anonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    demoEmail: readEnv('EXPO_PUBLIC_SUPABASE_DEMO_EMAIL'),
    demoPassword: readEnv('EXPO_PUBLIC_SUPABASE_DEMO_PASSWORD'),
  },
};
