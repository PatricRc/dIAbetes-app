/**
 * Metabolic Brain
 * Handles: meals, glucose readings, symptoms, medication adherence, daily risk.
 * Powered by: GPT-4o (structured reasoning) + Nutritionix data
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
      max_tokens: 512,
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

// ─── Meal Analysis ─────────────────────────────────────────────────────────────

/**
 * Analyze a meal with nutrition data and return glucose spike risk + recommendations.
 * @param {object} nutritionData - from nutritionixService (totals + foods[])
 * @param {string} foodDescription - Gemini vision description
 * @param {object} patientContext - { diabetes_type, recent_glucose, medications[] }
 */
export async function analyzeMeal(nutritionData, foodDescription, patientContext = {}) {
  const { totals, foods = [] } = nutritionData || {};

  const macroLine = totals
    ? `Calorías: ${Math.round(totals.calories)} kcal | Carbohidratos: ${Math.round(totals.carbs_g)}g | Proteína: ${Math.round(totals.protein_g)}g | Grasa: ${Math.round(totals.fat_g)}g | Fibra: ${Math.round(totals.fiber_g)}g | Azúcar: ${Math.round(totals.sugar_g)}g`
    : 'Macros no disponibles';

  const system = `Eres el Metabolic Brain de Diabetes Guardian, un asistente médico especializado en diabetes.
Analiza comidas para pacientes diabéticos. Responde siempre en español.
Formato JSON: { "spike_risk": "bajo|moderado|alto", "spike_risk_reason": "...", "recommendation": "...", "action": "..." }
El campo "action" es una acción concreta que el paciente puede tomar ahora.`;

  const user = `Paciente: diabetes tipo ${patientContext.diabetes_type ?? 'desconocido'}.
Glucosa reciente: ${patientContext.recent_glucose ?? 'desconocida'} mg/dL.
Medicamentos activos: ${(patientContext.medications ?? []).join(', ') || 'ninguno'}.

Comida ingerida: ${foodDescription}
Macros: ${macroLine}

Evalúa el riesgo de pico glucémico y da una recomendación específica.`;

  return await chatComplete(system, user, true);
}

// ─── Glucose Assessment ────────────────────────────────────────────────────────

/**
 * Assess a glucose reading in clinical context.
 * @param {number} value - mg/dL
 * @param {string} context - fasting | post_meal | bedtime | random
 * @param {object} patientContext
 */
export async function assessGlucose(value, context, patientContext = {}) {
  const system = `Eres el Metabolic Brain de Diabetes Guardian.
Evalúa lecturas de glucosa para pacientes diabéticos. Responde en español.
Formato JSON: { "classification": "normal|elevada|baja|crítica", "interpretation": "...", "recommendation": "...", "action": "..." }`;

  const user = `Lectura: ${value} mg/dL (contexto: ${context}).
Paciente: diabetes tipo ${patientContext.diabetes_type ?? 'desconocido'}.
Medicamentos: ${(patientContext.medications ?? []).join(', ') || 'ninguno'}.
¿Cómo interpretas esta lectura?`;

  return await chatComplete(system, user, true);
}

// ─── Daily Check ───────────────────────────────────────────────────────────────

/**
 * Generate a brief daily metabolic summary from recent events.
 * @param {string[]} recentChunks - content_text from Pinecone matches
 */
export async function dailySummary(recentChunks) {
  const system = `Eres el Metabolic Brain de Diabetes Guardian.
Genera un resumen diario breve y accionable del estado metabólico del paciente. Responde en español.
Formato JSON: { "headline": "...", "insight": "...", "priority_action": "..." }`;

  const user = `Eventos recientes del paciente (últimas 24 horas):
${recentChunks.join('\n---\n')}

¿Cuál es el estado metabólico hoy y qué debe priorizar?`;

  return await chatComplete(system, user, true);
}
