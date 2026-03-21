/**
 * captureService.js — Master Capture Orchestrator
 *
 * The full pipeline: Capturar → Entender → Acompañar
 *
 * 1. Receive raw capture (text | meal photo | document | audio)
 * 2. Pre-process with fileIngestionService (OCR, vision, transcription)
 * 3. Embed with Gemini embedding-2-preview
 * 4. Upsert to Pinecone (vector memory)
 * 5. Save to Supabase (structured record + memory_chunks tracker)
 * 6. Route to the right brain for AI guidance
 * 7. Return result { guidance, nutritionData?, summary? }
 */

import { embedContent } from './embeddingService';
import { upsertVector } from './pineconeService';
import { supabase } from './supabaseClient';
import {
  processText,
  processMealPhoto,
  processDocument,
  processAudio,
} from './fileIngestionService';
import { analyzeMeal, assessGlucose } from './brains/metabolicBrain';
import { summarizeDocument, summarizeTranscript } from './brains/clinicalBrain';
import { buildPatientContext } from './brains/memoryBrain';

// ─── Main Entry Point ──────────────────────────────────────────────────────────

/**
 * Process any type of patient capture through the full pipeline.
 *
 * @param {object} params
 * @param {'text'|'meal_photo'|'document'|'audio'} params.type
 * @param {string} [params.text]          - for type='text'
 * @param {string} [params.imageUri]      - local file:// URI for meal photo
 * @param {string} [params.documentUri]   - local file:// URI for PDF/image doc
 * @param {string} [params.documentMime]  - mime type for document
 * @param {string} [params.audioUri]      - local file:// URI for audio
 * @param {string} [params.audioMime]     - mime type for audio
 * @param {string} params.patientId       - Supabase patient UUID
 *
 * @returns {{ guidance: object, nutritionData?: object, clinicalSummary?: object, recordId: string }}
 */
export async function processCapture({
  type,
  text,
  imageUri,
  documentUri,
  documentMime,
  audioUri,
  audioMime,
  patientId,
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  // ── Step 1: Pre-process ──────────────────────────────────────────────────────
  let ingested;

  switch (type) {
    case 'text':
      ingested = await processText(text);
      break;
    case 'meal_photo':
      ingested = await processMealPhoto(imageUri);
      break;
    case 'document':
      ingested = await processDocument(documentUri, documentMime);
      break;
    case 'audio':
      ingested = await processAudio(audioUri, audioMime);
      break;
    default:
      throw new Error(`Unknown capture type: ${type}`);
  }

  const { contentText, contentKind, metadata, nutritionData, foodDescription } = ingested;

  // ── Step 2: Save capture entry to Supabase ───────────────────────────────────
  const capturePayload = {
    patient_id: patientId,
    created_by: userId,
    input_type: type === 'meal_photo' ? 'photo' : type,
    source_text: contentText.slice(0, 5000),
    status: 'processing',
    classified_as: contentKind,
    classification_json: { content_kind: contentKind },
    extraction_json: nutritionData ? { nutrition: nutritionData } : {},
    captured_at: new Date().toISOString(),
  };

  const { data: captureEntry, error: captureError } = await supabase
    .from('capture_entries')
    .insert(capturePayload)
    .select('id')
    .single();

  const captureEntryId = captureEntry?.id ?? null;
  if (captureError) {
    console.warn('Supabase capture_entries insert failed:', captureError.message);
  }

  // ── Step 3: Embed with Gemini embedding-2-preview ────────────────────────────
  let embedding, geminiFileUri;

  try {
    const embedResult = await embedContent({
      text: contentText,
      taskType: 'RETRIEVAL_DOCUMENT',
    });
    embedding = embedResult.embedding;
    geminiFileUri = embedResult.geminiFileUri;
  } catch (err) {
    console.error('Embedding failed:', err.message);
    throw err;
  }

  // ── Step 4: Generate Pinecone record ID and upsert ───────────────────────────
  const recordId = `${patientId}_${type}_${Date.now()}`;

  const pineconeMetadata = {
    ...metadata,
    capture_entry_id: captureEntryId,
    content_kind: contentKind,
  };

  try {
    await upsertVector(patientId, recordId, embedding, pineconeMetadata);
  } catch (err) {
    console.error('Pinecone upsert failed:', err.message);
    // Non-fatal: continue, Supabase is source of truth
  }

  // ── Step 5: Save memory_chunk tracker to Supabase ───────────────────────────
  if (captureEntryId) {
    const { error: chunkError } = await supabase.from('memory_chunks').insert({
      patient_id: patientId,
      source_type: metadata.source_type ?? 'capture_entry',
      source_table: 'capture_entries',
      source_record_id: captureEntryId,
      content_kind: contentKind,
      chunk_index: 0,
      content_text: contentText.slice(0, 10000),
      metadata_json: pineconeMetadata,
      embedding_provider: 'gemini',
      embedding_model: 'gemini-embedding-2-preview',
      pinecone_namespace: `patient-${patientId}`,
      pinecone_record_id: recordId,
      sync_status: 'completed',
      last_synced_at: new Date().toISOString(),
    });

    if (chunkError) {
      console.warn('Supabase memory_chunks insert failed:', chunkError.message);
    }

    // Mark capture entry as completed
    await supabase
      .from('capture_entries')
      .update({ status: 'completed' })
      .eq('id', captureEntryId);
  }

  // ── Step 6: Route to brain for AI guidance ───────────────────────────────────
  let guidance = null;
  let clinicalSummary = null;

  try {
    // Get patient context from Memory Brain for richer brain inputs
    const patientContext = await buildPatientContext(patientId, contentText);

    if (type === 'meal_photo') {
      guidance = await analyzeMeal(nutritionData, foodDescription, patientContext);
    } else if (contentKind === 'glucose_note') {
      // Extract glucose value from text
      const match = contentText.match(/(\d{2,3})\s*(mg\/dl|mgdl)?/i);
      const value = match ? parseInt(match[1], 10) : null;
      if (value) {
        guidance = await assessGlucose(value, 'random', patientContext);
      }
    } else if (type === 'document') {
      clinicalSummary = await summarizeDocument(contentText, contentKind);
      guidance = {
        spike_risk: null,
        recommendation: clinicalSummary.summary,
        action: (clinicalSummary.follow_up_actions ?? [])[0] ?? 'Documento registrado en tu historial.',
      };
    } else if (type === 'audio') {
      clinicalSummary = await summarizeTranscript(contentText);
      guidance = {
        recommendation: clinicalSummary.summary,
        action: (clinicalSummary.follow_up_actions ?? [])[0] ?? 'Nota de voz registrada en tu historial.',
      };
    } else {
      // Free text — general confirmation
      guidance = {
        recommendation: 'Tu nota ha sido registrada y procesada.',
        action: 'Puedes hacer preguntas sobre este evento en el Asistente.',
      };
    }
  } catch (err) {
    console.warn('Brain analysis failed, returning basic guidance:', err.message);
    guidance = {
      recommendation: 'Tu captura ha sido guardada en tu historial.',
      action: 'Puedes consultarlo en el Asistente en cualquier momento.',
    };
  }

  return {
    recordId,
    captureEntryId,
    contentKind,
    guidance,
    nutritionData: nutritionData ?? null,
    clinicalSummary: clinicalSummary ?? null,
    // Food vision fields
    foodTitle:       ingested.foodTitle       ?? null,
    foodDescription: ingested.foodDescription ?? null,
    foodCategory:    ingested.foodCategory    ?? null,
    ingredients:     ingested.ingredients     ?? null,
    // Audio/document extracted text (shown in result card)
    transcript:      type === 'audio'    ? contentText : null,
    extractedText:   type === 'document' ? contentText : null,
  };
}
