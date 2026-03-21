// Central config — all API keys read from EXPO_PUBLIC_ env vars
// which Expo automatically inlines at build time

export const CONFIG = {
  gemini: {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    embeddingModel: 'gemini-embedding-2-preview',
    visionModel: 'gemini-2.0-flash',
    embeddingDims: 768, // MRL truncation — fast + cost-effective for demo
  },
  pinecone: {
    apiKey: process.env.EXPO_PUBLIC_PINECONE_API_KEY,
    indexHost: process.env.EXPO_PUBLIC_PINECONE_INDEX_HOST,
    indexName: process.env.EXPO_PUBLIC_PINECONE_INDEX_NAME || 'diabetes-guardian',
    topK: 8,
  },
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    transcriptionModel: 'gpt-4o-transcribe',
    reasoningModel: 'gpt-4o',
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    demoEmail: process.env.EXPO_PUBLIC_SUPABASE_DEMO_EMAIL,
    demoPassword: process.env.EXPO_PUBLIC_SUPABASE_DEMO_PASSWORD,
  },
};
