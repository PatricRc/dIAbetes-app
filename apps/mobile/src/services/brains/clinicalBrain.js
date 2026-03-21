/**
 * Clinical Brain
 * Handles: doctor notes, lab results, prescriptions, transcripts, medication extraction.
 * Powered by: GPT-4o structured output
 */

import { CONFIG } from '../config';

const { apiKey, reasoningModel } = CONFIG.openai;

async function chatComplete(systemPrompt, userPrompt, jsonMode = false) {
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
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenAI error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return jsonMode ? JSON.parse(text) : text;
}

// ─── Document Summary ──────────────────────────────────────────────────────────

/**
 * Summarize a clinical document (lab result, doctor note, prescription).
 * Returns structured clinical summary with follow-up actions.
 */
export async function summarizeDocument(extractedText, documentType = 'clinical_document') {
  const system = `Eres el Clinical Brain de Diabetes Guardian, un asistente médico experto.
Analiza documentos clínicos para pacientes diabéticos. Responde siempre en español.
Formato JSON: {
  "document_type": "lab_result|doctor_note|prescription|other",
  "summary": "Resumen claro en 2-3 oraciones",
  "key_findings": ["hallazgo 1", "hallazgo 2"],
  "medications_mentioned": [{ "name": "...", "dose": "...", "instructions": "..." }],
  "lab_values": [{ "name": "...", "value": "...", "unit": "...", "status": "normal|alto|bajo" }],
  "follow_up_actions": ["acción 1", "acción 2"],
  "urgency": "rutina|pronto|urgente"
}`;

  const user = `Tipo de documento: ${documentType}

Texto extraído:
${extractedText}

Analiza este documento clínico y extrae toda la información relevante.`;

  return await chatComplete(system, user, true);
}

// ─── Transcript Summary ────────────────────────────────────────────────────────

/**
 * Summarize an audio transcript (voice note or doctor visit recording).
 */
export async function summarizeTranscript(transcript) {
  const system = `Eres el Clinical Brain de Diabetes Guardian.
Analiza transcripciones de notas de voz y visitas médicas. Responde en español.
Formato JSON: {
  "summary": "...",
  "symptoms_mentioned": ["síntoma 1"],
  "medications_mentioned": [{ "name": "...", "change": "nueva|ajustada|suspendida|sin cambio" }],
  "glucose_readings_mentioned": [{ "value": 0, "context": "..." }],
  "doctor_instructions": ["instrucción 1"],
  "follow_up_actions": ["acción 1"]
}`;

  const user = `Transcripción de nota de voz:
${transcript}

Extrae toda la información clínica relevante de esta nota.`;

  return await chatComplete(system, user, true);
}

// ─── Medication Extraction ─────────────────────────────────────────────────────

/**
 * Extract structured medication list from any text.
 * Safety note: for reference only — never autonomously change doses.
 */
export async function extractMedications(text) {
  const system = `Eres el Clinical Brain de Diabetes Guardian.
Extrae medicamentos mencionados en texto clínico. Responde en español.
Formato JSON: { "medications": [{ "name": "...", "dose": "...", "unit": "...", "frequency": "...", "route": "oral|subcutáneo|otro", "instructions": "..." }] }
IMPORTANTE: Esta información es solo de referencia. Nunca prescribas ni cambies dosis.`;

  const user = text;

  return await chatComplete(system, user, true);
}

// ─── Doctor Visit Prep ─────────────────────────────────────────────────────────

/**
 * Generate talking points for an upcoming doctor appointment.
 * @param {string[]} recentHistory - recent content chunks from Pinecone
 * @param {string} appointmentType - e.g. "endocrinólogo", "médico general"
 */
export async function prepareForAppointment(recentHistory, appointmentType = 'médico') {
  const system = `Eres el Clinical Brain de Diabetes Guardian.
Prepara al paciente para una visita médica con base en su historial reciente. Responde en español.
Formato JSON: {
  "summary_for_doctor": "Resumen de 3-4 oraciones del estado actual del paciente",
  "key_points": ["punto 1", "punto 2", "punto 3"],
  "questions_to_ask": ["¿pregunta 1?", "¿pregunta 2?"],
  "bring_to_appointment": ["documento 1", "item 2"]
}`;

  const user = `Tipo de cita: ${appointmentType}

Historial reciente del paciente:
${recentHistory.join('\n---\n')}

¿Qué debe saber el médico y qué preguntas debería hacer el paciente?`;

  return await chatComplete(system, user, true);
}
