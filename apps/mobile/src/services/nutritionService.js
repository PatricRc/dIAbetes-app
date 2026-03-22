/**
 * nutritionService.js
 *
 * LLM-based nutrition estimator powered by Gemini with an OpenAI fallback.
 * Estimates macros from a food description
 * using a clinical dietitian prompt. Same output schema as the old service
 * so fileIngestionService.js and metabolicBrain.js need no changes.
 *
 * Output: { foods: [...], totals: { calories, carbs_g, protein_g, fat_g, fiber_g, sugar_g } }
 */

import { CONFIG } from './config';
import { generateStructuredJsonWithOpenAI } from './openaiResponsesService';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const { apiKey, visionModel } = CONFIG.gemini;

const SYSTEM_PROMPT = `Eres un dietista clínico especializado en diabetes tipo 2.
Estimas el contenido nutricional de alimentos para pacientes diabéticos.
Sé preciso con los carbohidratos porque afectan directamente la glucosa.
Si hay varios ingredientes, calcula el total combinado.
Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.`;

const NUTRITION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    foods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          calories: { type: 'number' },
          carbs_g: { type: 'number' },
          protein_g: { type: 'number' },
          fat_g: { type: 'number' },
          fiber_g: { type: 'number' },
          sugar_g: { type: 'number' },
          serving_qty: { type: 'number' },
          serving_unit: { type: 'string' },
          glycemic_index: {
            anyOf: [
              { type: 'number' },
              { type: 'null' },
            ],
          },
        },
        required: [
          'name',
          'calories',
          'carbs_g',
          'protein_g',
          'fat_g',
          'fiber_g',
          'sugar_g',
          'serving_qty',
          'serving_unit',
          'glycemic_index',
        ],
        additionalProperties: false,
      },
    },
    totals: {
      type: 'object',
      properties: {
        calories: { type: 'number' },
        carbs_g: { type: 'number' },
        protein_g: { type: 'number' },
        fat_g: { type: 'number' },
        fiber_g: { type: 'number' },
        sugar_g: { type: 'number' },
      },
      required: ['calories', 'carbs_g', 'protein_g', 'fat_g', 'fiber_g', 'sugar_g'],
      additionalProperties: false,
    },
  },
  required: ['foods', 'totals'],
  additionalProperties: false,
};

function normalizeNutritionResponse(parsed, query) {
  const foods = (parsed.foods ?? []).map((f) => ({
    name: f.name ?? query,
    calories: Number(f.calories) || 0,
    carbs_g: Number(f.carbs_g) || 0,
    protein_g: Number(f.protein_g) || 0,
    fat_g: Number(f.fat_g) || 0,
    fiber_g: Number(f.fiber_g) || 0,
    sugar_g: Number(f.sugar_g) || 0,
    serving_qty: f.serving_qty ?? 1,
    serving_unit: f.serving_unit ?? 'porción',
    glycemic_index: f.glycemic_index ?? null,
  }));

  const totals = parsed.totals
    ? {
        calories: Number(parsed.totals.calories) || 0,
        carbs_g: Number(parsed.totals.carbs_g) || 0,
        protein_g: Number(parsed.totals.protein_g) || 0,
        fat_g: Number(parsed.totals.fat_g) || 0,
        fiber_g: Number(parsed.totals.fiber_g) || 0,
        sugar_g: Number(parsed.totals.sugar_g) || 0,
      }
    : foods.reduce(
        (acc, f) => ({
          calories: acc.calories + f.calories,
          carbs_g: acc.carbs_g + f.carbs_g,
          protein_g: acc.protein_g + f.protein_g,
          fat_g: acc.fat_g + f.fat_g,
          fiber_g: acc.fiber_g + f.fiber_g,
          sugar_g: acc.sugar_g + f.sugar_g,
        }),
        { calories: 0, carbs_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0 }
      );

  return { foods, totals };
}

async function analyzeMealTextWithOpenAI(query, userPrompt) {
  const parsed = await generateStructuredJsonWithOpenAI({
    instructions: SYSTEM_PROMPT,
    prompt: userPrompt,
    schemaName: 'meal_nutrition',
    schema: NUTRITION_RESPONSE_SCHEMA,
    maxOutputTokens: 512,
  });

  return normalizeNutritionResponse(parsed, query);
}

/**
 * Estimate macros for a food description using Gemini.
 * @param {string} query - food name or ingredient list (from Vision analysis)
 * @returns {{ foods: object[], totals: object }}
 */
export async function analyzeMealText(query) {
  const userPrompt = `Alimento a analizar: "${query}"

Devuelve SOLO este JSON (valores numéricos, no cadenas):
{
  "foods": [
    {
      "name": "nombre del alimento",
      "calories": 0,
      "carbs_g": 0,
      "protein_g": 0,
      "fat_g": 0,
      "fiber_g": 0,
      "sugar_g": 0,
      "serving_qty": 1,
      "serving_unit": "porción",
      "glycemic_index": null
    }
  ],
  "totals": {
    "calories": 0,
    "carbs_g": 0,
    "protein_g": 0,
    "fat_g": 0,
    "fiber_g": 0,
    "sugar_g": 0
  }
}`;

  try {
    const res = await fetch(
      `${BASE_URL}/models/${visionModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Gemini nutrition error: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return normalizeNutritionResponse(JSON.parse(text), query);
  } catch (geminiError) {
    console.warn('[analyzeMealText] Gemini failed, falling back to OpenAI:', geminiError.message);
    return analyzeMealTextWithOpenAI(query, userPrompt);
  }
}
