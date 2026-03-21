/**
 * Memory Brain
 * Handles: RAG-backed Q&A, "what changed?", timeline summaries, patient context packaging.
 * Powered by: Pinecone (retrieval) + GPT-4o (reasoning)
 */

import { embedText } from '../embeddingService';
import { queryVectors } from '../pineconeService';
import { CONFIG } from '../config';

const { apiKey, reasoningModel } = CONFIG.openai;

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

/**
 * Retrieve the most relevant patient history chunks for a given question.
 * @returns {string[]} array of content_text strings
 */
export async function retrieveContext(patientId, question, topK = 8) {
  const queryEmbedding = await embedText(question, 'RETRIEVAL_QUERY');
  const matches = await queryVectors(patientId, queryEmbedding, topK);

  return matches
    .filter((m) => m.score > 0.5) // relevance threshold
    .map((m) => m.metadata?.content_text ?? '')
    .filter(Boolean);
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
export async function answerQuestion(question, patientId) {
  const contextChunks = await retrieveContext(patientId, question);

  const system = `Eres el Memory Brain de Diabetes Guardian, el asistente médico personal del paciente.
Respondes preguntas usando el historial médico real del paciente. Responde SIEMPRE en español.
Sé claro, empático y preciso. Nunca inventes datos que no estén en el historial.
Si no hay suficiente información, dilo honestamente.
Formato JSON: { "answer": "...", "source_summary": "Basado en: ...", "next_action": "..." }
El campo "next_action" es una acción concreta que el paciente puede tomar.
IMPORTANTE: Para medicamentos, solo proporciona información educativa. Nunca cambies dosis o prescripciones.`;

  const context = contextChunks.length > 0
    ? contextChunks.join('\n---\n')
    : 'No hay historial suficiente aún. El paciente está comenzando a usar la aplicación.';

  const user = `Pregunta del paciente: "${question}"

Historial médico relevante:
${context}`;

  return await chatComplete(system, user);
}

// ─── What Changed ──────────────────────────────────────────────────────────────

/**
 * Compare recent history to a baseline date and report what changed.
 * Typical use: "¿Qué cambió desde mi última visita?"
 */
export async function whatChanged(patientId, sinceLabel = 'mi última visita') {
  const question = `Cambios desde ${sinceLabel}: glucosa, medicamentos, síntomas, laboratorios`;
  const contextChunks = await retrieveContext(patientId, question, 12);

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

  return await chatComplete(system, user);
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
