/**
 * fileIngestionService.js
 *
 * Pre-processes each capture type before embedding.
 * Returns a normalized { contentText, metadata, nutritionData? } payload
 * that captureService then embeds and stores.
 */

import { describeImage, extractDocumentText } from './embeddingService';
import { analyzeMealText } from './nutritionService';
import { inferAudioFileName } from './audioRecordingService';
import { ensureSupabaseSession } from './patientSessionService';
import { supabase } from './supabaseClient';

// ─── Text ──────────────────────────────────────────────────────────────────────

/**
 * Process a plain-text capture.
 * Classifies it and extracts key facts.
 */
export async function processText(text) {
  // Classify the text input type using simple keyword matching
  // (replaced by Gemini classify call in production)
  const lower = text.toLowerCase();
  let contentKind = 'free_text';

  if (lower.includes('glucos') || lower.includes('azúcar') || /\d{2,3}\s*(mg\/dl|mgdl)/i.test(text)) {
    contentKind = 'glucose_note';
  } else if (lower.includes('comí') || lower.includes('comer') || lower.includes('desayun') || lower.includes('almorzé') || lower.includes('cené')) {
    contentKind = 'meal_note';
  } else if (lower.includes('tomé') || lower.includes('pastilla') || lower.includes('insulina') || lower.includes('metformin')) {
    contentKind = 'medication_note';
  } else if (lower.includes('me siento') || lower.includes('dolor') || lower.includes('mareo') || lower.includes('cansad')) {
    contentKind = 'symptom_note';
  }

  return {
    contentText: text,
    contentKind,
    metadata: {
      source_type: 'capture_entry',
      content_kind: contentKind,
      content_text: text,
      date: new Date().toISOString(),
    },
  };
}

// ─── Meal Photo ────────────────────────────────────────────────────────────────

/**
 * Process a meal photo:
 * 1. Gemini Vision (with OpenAI fallback) → food description
 * 2. Nutrition model (with OpenAI fallback) → macros
 * Returns contentText (for embedding) + nutritionData (for brain)
 */
export async function processMealPhoto(imageUri) {
  // Step 1: Vision model — structured food identification
  const VISION_PROMPT = `Eres un nutricionista clínico analizando una imagen para un paciente diabético.
Examina la imagen con detalle y responde EXACTAMENTE con este formato (sin texto adicional):

TITULO: [nombre del plato o bebida en 3-6 palabras en español]
INGREDIENTES: [ingredientes visibles separados por coma, con cantidades estimadas]
DESCRIPCION: [descripción de preparación y porciones en 1-2 oraciones]
CATEGORIA: [bebida|desayuno|almuerzo|cena|snack|postre]

Si NO hay comida visible responde:
TITULO: Sin alimentos detectados
INGREDIENTES: ninguno
DESCRIPCION: No se detectaron alimentos en la imagen.
CATEGORIA: sin_categoria`;

  const rawVision = await describeImage(imageUri, VISION_PROMPT);

  // Parse structured fields
  const field = (label) => {
    const m = rawVision.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
    return m ? m[1].trim() : '';
  };

  const foodTitle       = field('TITULO')      || 'Alimento capturado';
  const ingredients     = field('INGREDIENTES') || '';
  const foodDescription = field('DESCRIPCION') || rawVision;
  const foodCategory    = field('CATEGORIA')   || 'comida';

  const noFood = foodTitle.toLowerCase().includes('sin alimentos');

  // Step 2: Nutrition model — get macros using ingredients or title as query
  let nutritionData = null;
  if (!noFood) {
    const nutritionQuery = ingredients && ingredients !== 'ninguno'
      ? ingredients
      : foodTitle;
    try {
      nutritionData = await analyzeMealText(nutritionQuery);
    } catch (e) {
      console.warn('Nutrition lookup failed:', e.message);
    }
  }

  const macroLine = nutritionData
    ? `Calorías: ${Math.round(nutritionData.totals.calories)} kcal, Carbohidratos: ${Math.round(nutritionData.totals.carbs_g)}g, Proteína: ${Math.round(nutritionData.totals.protein_g)}g, Grasa: ${Math.round(nutritionData.totals.fat_g)}g`
    : '';

  // Full text stored in Pinecone/Supabase for RAG
  const contentText = [
    `Alimento: ${foodTitle}`,
    `Ingredientes: ${ingredients}`,
    foodDescription,
    macroLine,
  ].filter(Boolean).join('\n');

  return {
    contentText,
    contentKind: 'meal_photo',
    foodTitle,
    foodDescription,
    foodCategory,
    ingredients,
    nutritionData,
    metadata: {
      source_type: 'capture_entry',
      content_kind: 'meal_photo',
      content_text: contentText,
      food_title: foodTitle,
      food_category: foodCategory,
      date: new Date().toISOString(),
    },
  };
}

// ─── Document (PDF / image of document) ────────────────────────────────────────

/**
 * Process a clinical document:
 * 1. Gemini extracts raw text (OCR)
 * 2. Returns extracted text for the clinical brain to summarize
 */
export async function processDocument(fileUri, mimeType) {
  const extractedText = await extractDocumentText(fileUri, mimeType);

  // Detect document type from extracted text
  const lower = extractedText.toLowerCase();
  let documentType = 'clinical_document';
  if (lower.includes('hba1c') || lower.includes('hemoglobina') || lower.includes('glucosa en ayuno')) {
    documentType = 'lab_result';
  } else if (lower.includes('receta') || lower.includes('prescripción') || lower.includes('metformin')) {
    documentType = 'prescription';
  } else if (lower.includes('consulta') || lower.includes('médico') || lower.includes('diagnóstico')) {
    documentType = 'doctor_note';
  }

  return {
    contentText: extractedText,
    contentKind: documentType,
    metadata: {
      source_type: 'document',
      content_kind: documentType,
      content_text: extractedText,
      document_type: documentType,
      date: new Date().toISOString(),
    },
  };
}

// ─── Audio ─────────────────────────────────────────────────────────────────────

/**
 * Process an audio note:
 * 1. Supabase Edge Function → OpenAI transcription + clinical summary
 * 2. Returns transcript text for embedding and downstream storage
 */
export async function processAudio(audioUri, mimeType = 'audio/m4a') {
  if (!audioUri) {
    throw new Error('No se encontró el archivo de audio para transcribir.');
  }

  const invokeAudioIntake = async () => {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: inferAudioFileName(mimeType),
    });
    formData.append('language', 'es');

    return supabase.functions.invoke('audio-intake', {
      body: formData,
    });
  };

  const resolveErrorMessage = async (error, response) => {
    let message = 'No se pudo transcribir el audio en este momento.';

    try {
      const contentType = response?.headers?.get?.('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        if (typeof payload?.message === 'string' && payload.message.trim()) {
          message = payload.message.trim();
        }
      } else {
        const rawText = await response?.text?.();
        if (rawText?.trim()) {
          message = rawText.trim();
        }
      }
    } catch {
      // fall through to generic error extraction
    }

    if (message === 'No se pudo transcribir el audio en este momento.' && error?.message) {
      message = error.message;
    }

    const isInvalidJwt = /invalid jwt/i.test(message);

    return {
      isInvalidJwt,
      message: isInvalidJwt
        ? 'No se pudo validar la sesión de Supabase. Reinicia la app y vuelve a intentar. Si continúa, recompila la app con las variables de entorno actualizadas.'
        : message,
    };
  };

  let { data, error, response } = await invokeAudioIntake();

  if (error) {
    let { message, isInvalidJwt } = await resolveErrorMessage(error, response);

    if (isInvalidJwt) {
      await ensureSupabaseSession();
      ({ data, error, response } = await invokeAudioIntake());

      if (!error) {
        message = '';
      } else {
        ({ message } = await resolveErrorMessage(error, response));
      }
    }

    if (error) {
      throw new Error(message);
    }
  }

  const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
  if (!transcript) {
    throw new Error('La transcripción llegó vacía. Intenta grabar de nuevo.');
  }

  return {
    contentText: transcript,
    contentKind: 'audio_transcript',
    clinicalSummary: data?.clinicalSummary ?? null,
    metadata: {
      source_type: 'transcript',
      content_kind: 'audio_transcript',
      content_text: transcript,
      date: new Date().toISOString(),
    },
  };
}
