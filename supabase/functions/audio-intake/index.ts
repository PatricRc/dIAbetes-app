const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
const DEFAULT_REASONING_MODEL = 'gpt-4o';

const TRANSCRIPT_SUMMARY_SYSTEM_PROMPT = `Eres el Clinical Brain de Diabetes Guardian.
Analiza transcripciones de notas de voz y visitas médicas. Responde en español.
Formato JSON: {
  "summary": "...",
  "symptoms_mentioned": ["síntoma 1"],
  "medications_mentioned": [{ "name": "...", "change": "nueva|ajustada|suspendida|sin cambio" }],
  "glucose_readings_mentioned": [{ "value": 0, "context": "..." }],
  "doctor_instructions": ["instrucción 1"],
  "follow_up_actions": ["acción 1"]
}`;

class PublicError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getRequiredOpenAIKey() {
  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim();
  if (!apiKey) {
    throw new PublicError(
      500,
      'La transcripción de audio no está configurada en Supabase. Falta OPENAI_API_KEY.'
    );
  }
  return apiKey;
}

function getStringField(formData: FormData, key: string, fallback = '') {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function buildFallbackSummary(transcript: string) {
  const compact = transcript.replace(/\s+/g, ' ').trim();
  const preview = compact.length > 220 ? `${compact.slice(0, 217).trim()}...` : compact;

  return {
    summary: preview || 'Nota de voz registrada en tu historial clínico.',
    symptoms_mentioned: [],
    medications_mentioned: [],
    glucose_readings_mentioned: [],
    doctor_instructions: [],
    follow_up_actions: ['Revisa la transcripción guardada en tu historial.'],
  };
}

async function transcribeAudio(args: {
  apiKey: string;
  audioFile: File;
  language: string;
}) {
  const transcriptionModel =
    Deno.env.get('OPENAI_TRANSCRIPTION_MODEL')?.trim() || DEFAULT_TRANSCRIPTION_MODEL;

  const formData = new FormData();
  formData.append('file', args.audioFile, args.audioFile.name || 'audio_note.m4a');
  formData.append('model', transcriptionModel);
  formData.append('language', args.language);
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('OpenAI transcription failed:', detail);

    if (response.status === 401) {
      throw new PublicError(
        500,
        'La función de audio no tiene una credencial válida de OpenAI en el backend.'
      );
    }

    throw new PublicError(502, 'No se pudo transcribir el audio en este momento.');
  }

  const transcript = (await response.text()).trim();
  if (!transcript) {
    throw new PublicError(502, 'La transcripción llegó vacía desde OpenAI.');
  }

  return transcript;
}

async function summarizeTranscript(args: { apiKey: string; transcript: string }) {
  const reasoningModel =
    Deno.env.get('OPENAI_REASONING_MODEL')?.trim() || DEFAULT_REASONING_MODEL;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: reasoningModel,
      messages: [
        { role: 'system', content: TRANSCRIPT_SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Transcripción de nota de voz:\n${args.transcript}\n\nExtrae toda la información clínica relevante de esta nota.`,
        },
      ],
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('OpenAI transcript summary failed:', detail);
    throw new Error('summary_failed');
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('summary_empty');
  }

  return JSON.parse(content);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ message: 'Method not allowed.' }, 405);
  }

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      throw new PublicError(400, 'El audio debe enviarse como multipart/form-data.');
    }

    const formData = await request.formData();
    const fileValue = formData.get('file');

    if (!(fileValue instanceof File)) {
      throw new PublicError(400, 'No se recibió ningún archivo de audio.');
    }

    const apiKey = getRequiredOpenAIKey();
    const language = getStringField(formData, 'language', 'es');
    const transcript = await transcribeAudio({
      apiKey,
      audioFile: fileValue,
      language,
    });

    let clinicalSummary;
    try {
      clinicalSummary = await summarizeTranscript({ apiKey, transcript });
    } catch (error) {
      console.error('Transcript summarization fallback:', error);
      clinicalSummary = buildFallbackSummary(transcript);
    }

    return jsonResponse({
      transcript,
      clinicalSummary,
    });
  } catch (error) {
    if (error instanceof PublicError) {
      return jsonResponse({ message: error.message }, error.status);
    }

    console.error('audio-intake unexpected error:', error);
    return jsonResponse(
      { message: 'No se pudo procesar el audio en este momento.' },
      500
    );
  }
});
