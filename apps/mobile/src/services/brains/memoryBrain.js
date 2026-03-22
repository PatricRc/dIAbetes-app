/**
 * Memory Brain
 * Handles: RAG-backed Q&A, "what changed?", timeline summaries, patient context packaging.
 * Powered by: Supabase memory_chunks (retrieval) + OpenAI (reasoning)
 */

import { embedText } from '../embeddingService';
import { queryVectors } from '../pineconeService';
import { CONFIG } from '../config';
import { supabase } from '../supabaseClient';

const { apiKey, reasoningModel } = CONFIG.openai;
const SUPABASE_CONTEXT_FETCH_LIMIT = 60;
const SEARCH_STOPWORDS = new Set([
  'que', 'qué', 'como', 'cómo', 'para', 'desde', 'sobre', 'esta', 'este', 'estos', 'estas',
  'entre', 'donde', 'dónde', 'cual', 'cuál', 'cuáles', 'cuando', 'cuándo', 'ayer', 'hoy',
  'última', 'ultima', 'visita', 'tengo', 'tiene', 'con', 'sin', 'las', 'los', 'una', 'uno',
  'unos', 'unas', 'por', 'del', 'al', 'mis', 'sus', 'hay', 'fue', 'han', 'más', 'mas',
]);

async function chatComplete(systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: reasoningModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenAI error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(text);
}

// ─── Core RAG Retrieval ────────────────────────────────────────────────────────

function normalizeSearchText(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearchText(text = '') {
  return [...new Set(
    normalizeSearchText(text)
      .split(' ')
      .filter((token) => token.length > 2 && !SEARCH_STOPWORDS.has(token))
  )];
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildChunkSearchBlob(entry) {
  return normalizeSearchText([
    entry.content_kind ?? '',
    entry.content_text ?? '',
    JSON.stringify(entry.metadata_json ?? {}),
  ].join(' '));
}

function calculateChunkScore(entry, queryTokens) {
  const haystack = buildChunkSearchBlob(entry);
  if (!haystack) {
    return 0;
  }

  let score = 0;

  queryTokens.forEach((token, index) => {
    if (!haystack.includes(token)) {
      return;
    }

    const exactMatches = haystack.match(new RegExp(`\\b${escapeRegExp(token)}\\b`, 'g'))?.length ?? 0;
    score += exactMatches > 0 ? exactMatches * (index < 3 ? 5 : 3) : 1;

    if ((entry.content_kind ?? '').toLowerCase().includes(token)) {
      score += 4;
    }
  });

  if (entry.created_at) {
    const ageInDays = (Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays <= 7) {
      score += 3;
    } else if (ageInDays <= 30) {
      score += 2;
    } else if (ageInDays <= 90) {
      score += 1;
    }
  }

  return score;
}

function formatContextEntry(entry) {
  const parts = [];

  if (entry.content_kind) {
    parts.push(`Tipo: ${entry.content_kind}`);
  }

  if (entry.created_at) {
    parts.push(`Fecha: ${new Date(entry.created_at).toLocaleDateString('es-PE')}`);
  }

  return [parts.join(' | '), entry.content_text].filter(Boolean).join('\n');
}

function dedupeContextEntries(entries) {
  const seen = new Set();

  return entries.filter((entry) => {
    const key = entry.id ?? entry.content_text;
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildCitations(entries = []) {
  return entries.slice(0, 4).map((entry) => ({
    chunk_id: entry.id ?? null,
    content_kind: entry.content_kind ?? null,
    created_at: entry.created_at ?? null,
    excerpt: (entry.content_text ?? '').slice(0, 180),
  }));
}

function buildRecentConversationSnippet(recentConversation = []) {
  return recentConversation
    .filter((message) => message?.content_text)
    .slice(-6)
    .map((message) => `${message.role === 'assistant' ? 'Asistente' : 'Paciente'}: ${message.content_text}`)
    .join('\n');
}

async function retrieveContextEntriesFromSupabase(patientId, question, topK = 8) {
  const { data, error } = await supabase
    .from('memory_chunks')
    .select('id, content_text, content_kind, metadata_json, created_at')
    .eq('patient_id', patientId)
    .eq('sync_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(Math.max(SUPABASE_CONTEXT_FETCH_LIMIT, topK * 8));

  if (error) {
    throw new Error(`Supabase memory_chunks query failed: ${error.message}`);
  }

  const rows = (data ?? []).filter((entry) => entry.content_text?.trim());
  if (!rows.length) {
    return [];
  }

  const queryTokens = tokenizeSearchText(question);
  const ranked = rows
    .map((entry) => ({
      ...entry,
      _score: calculateChunkScore(entry, queryTokens),
      contextText: formatContextEntry(entry),
    }))
    .sort(
      (a, b) =>
        b._score - a._score ||
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );

  const relevantEntries = ranked.filter((entry) => entry._score > 0).slice(0, topK);
  const fallbackEntries = ranked.slice(0, Math.min(topK, ranked.length));

  return dedupeContextEntries(relevantEntries.length ? relevantEntries : fallbackEntries).slice(0, topK);
}

async function retrieveContextEntriesFromPinecone(patientId, question, topK = 8) {
  const queryEmbedding = await embedText(question, 'RETRIEVAL_QUERY');
  const matches = await queryVectors(patientId, queryEmbedding, topK);

  return matches
    .filter((match) => match.score > 0.5)
    .map((match) => {
      const entry = {
        id: match.id ?? null,
        content_text: match.metadata?.content_text ?? '',
        content_kind: match.metadata?.content_kind ?? null,
        metadata_json: match.metadata ?? {},
        created_at: match.metadata?.date ?? null,
      };

      return {
        ...entry,
        contextText: formatContextEntry(entry),
      };
    })
    .filter((entry) => entry.content_text);
}

async function retrieveContextEntries(patientId, question, topK = 8) {
  try {
    const supabaseEntries = await retrieveContextEntriesFromSupabase(patientId, question, topK);
    if (supabaseEntries.length > 0) {
      return supabaseEntries;
    }
  } catch (error) {
    console.warn('Supabase RAG retrieval failed:', error.message);
  }

  try {
    return await retrieveContextEntriesFromPinecone(patientId, question, topK);
  } catch (error) {
    console.warn('Pinecone RAG fallback failed:', error.message);
    return [];
  }
}

/**
 * Retrieve the most relevant patient history chunks for a given question.
 * @returns {string[]} array of content_text strings
 */
export async function retrieveContext(patientId, question, topK = 8) {
  const entries = await retrieveContextEntries(patientId, question, topK);
  return entries.map((entry) => entry.contextText).filter(Boolean);
}

// ─── Q&A ───────────────────────────────────────────────────────────────────────

/**
 * Answer any question using the patient's real medical history via RAG.
 * This powers the Asistente chat screen.
 *
 * @param {string} question
 * @param {string} patientId
 * @returns {{ answer: string, source_summary: string, next_action: string }}
 */
export async function answerQuestion(question, patientId, options = {}) {
  const contextEntries = await retrieveContextEntries(patientId, question, 8);
  const contextChunks = contextEntries.map((entry) => entry.contextText).filter(Boolean);
  const recentConversation = buildRecentConversationSnippet(options.recentConversation);

  const system = `Eres el Memory Brain de Diabetes Guardian, el asistente médico personal del paciente.
Respondes preguntas usando el historial médico real del paciente. Responde SIEMPRE en español.
Sé claro, empático y preciso. Nunca inventes datos que no estén en el historial.
Si no hay suficiente información, dilo honestamente.
Formato JSON: { "answer": "...", "source_summary": "Basado en: ...", "next_action": "...", "follow_ups": ["...", "..."] }
El campo "next_action" es una acción concreta que el paciente puede tomar.
IMPORTANTE: Para medicamentos, solo proporciona información educativa. Nunca cambies dosis o prescripciones.`;

  const context = contextChunks.length > 0
    ? contextChunks.join('\n---\n')
    : 'No hay historial suficiente aún. El paciente está comenzando a usar la aplicación.';

  const user = `${recentConversation ? `Conversación reciente del chat:\n${recentConversation}\n\n` : ''}Pregunta del paciente: "${question}"

Historial médico relevante:
${context}`;

  const response = await chatComplete(system, user);

  return {
    ...response,
    follow_ups: Array.isArray(response.follow_ups)
      ? response.follow_ups.filter(Boolean).slice(0, 3)
      : [],
    citations: buildCitations(contextEntries),
  };
}

// ─── What Changed ──────────────────────────────────────────────────────────────

/**
 * Compare recent history to a baseline date and report what changed.
 * Typical use: "¿Qué cambió desde mi última visita?"
 */
export async function whatChanged(patientId, sinceLabel = 'mi última visita') {
  const question = `Cambios desde ${sinceLabel}: glucosa, medicamentos, síntomas, laboratorios`;
  const contextEntries = await retrieveContextEntries(patientId, question, 12);
  const contextChunks = contextEntries.map((entry) => entry.contextText).filter(Boolean);

  const system = `Eres el Memory Brain de Diabetes Guardian.
Compara el historial del paciente e identifica cambios importantes. Responde en español.
Formato JSON: {
  "changes": [
    { "category": "glucosa|medicamentos|síntomas|labs|otro", "emoji": "...", "description": "...", "direction": "mejora|empeora|sin cambio" }
  ],
  "overall_trend": "mejorando|estable|empeorando",
  "headline": "Resumen en una oración",
  "next_action": "..."
}`;

  const user = `Paciente pregunta: "¿Qué cambió desde ${sinceLabel}?"

Historial disponible:
${contextChunks.join('\n---\n')}

Identifica los cambios más importantes.`;

  const response = await chatComplete(system, user);
  return {
    ...response,
    citations: buildCitations(contextEntries),
  };
}

// ─── Context Package (for other brains) ───────────────────────────────────────

/**
 * Build a patient context package for use by the Metabolic or Clinical brain.
 * Retrieves recent relevant history and returns structured context.
 */
export async function buildPatientContext(patientId, topic = 'estado general del paciente') {
  const contextChunks = await retrieveContext(patientId, topic, 10);

  const system = `Eres el Memory Brain de Diabetes Guardian.
Empaqueta el contexto del paciente para otros agentes. Responde en español.
Formato JSON: {
  "diabetes_type": "tipo_1|tipo_2|gestacional|prediabetes|desconocido",
  "recent_glucose": null,
  "medications": [],
  "recent_symptoms": [],
  "key_history": "Resumen de 2 oraciones del historial relevante"
}`;

  const user = `Historial del paciente:
${contextChunks.join('\n---\n')}

Extrae el contexto estructurado del paciente.`;

  return await chatComplete(system, user);
}

// ─── Timeline Build ────────────────────────────────────────────────────────────

/**
 * Build a chronological summary of the patient's medical timeline.
 */
export async function buildTimeline(patientId) {
  const question = 'historial completo: glucosa medicamentos síntomas laboratorios documentos';
  const contextChunks = await retrieveContext(patientId, question, 20);

  const system = `Eres el Memory Brain de Diabetes Guardian.
Construye una línea de tiempo médica del paciente. Responde en español.
Formato JSON: {
  "timeline": [
    { "date": "...", "event": "...", "category": "glucosa|medicamento|síntoma|lab|documento|otro" }
  ],
  "summary": "Resumen del historial en 2-3 oraciones"
}`;

  const user = `Historial del paciente:
${contextChunks.join('\n---\n')}

Organiza cronológicamente los eventos más importantes.`;

  return await chatComplete(system, user);
}
