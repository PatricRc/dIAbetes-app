import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { CONFIG } from './config';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const { apiKey, embeddingModel, embeddingDims } = CONFIG.gemini;
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ─── Text Embedding ────────────────────────────────────────────────────────────

/**
 * Embed plain text using Gemini embedding-2-preview.
 * taskType: RETRIEVAL_DOCUMENT | RETRIEVAL_QUERY | SEMANTIC_SIMILARITY
 */
export async function embedText(text, taskType = 'RETRIEVAL_DOCUMENT') {
  const res = await fetch(
    `${BASE_URL}/models/${embeddingModel}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${embeddingModel}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: embeddingDims,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini embedText error: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.embedding.values; // float[]
}

// ─── File Upload to Gemini Files API ──────────────────────────────────────────

/**
 * Upload a file to Gemini Files API and return the file URI.
 * The file URI is valid for 48 hours and can be used in embedContent or generateContent.
 * @param {string} localUri - expo file:// URI
 * @param {string} mimeType - e.g. 'image/jpeg', 'application/pdf', 'audio/mp3'
 * @param {string} displayName - human label for the file
 */
export async function uploadFileToGemini(localUri, mimeType, displayName = 'capture') {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 to binary for the multipart upload
  // Gemini Files API: POST /upload/v1beta/files
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

  // Build multipart body manually (no FormData in RN for binary uploads)
  const boundary = `--boundary_${Date.now()}`;
  const metadata = JSON.stringify({ file: { display_name: displayName, mime_type: mimeType } });

  // Two-part multipart: metadata + file bytes
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=utf-8',
    '',
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    'Content-Transfer-Encoding: base64',
    '',
    base64,
    `--${boundary}--`,
  ].join('\r\n');

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'X-Goog-Upload-Protocol': 'multipart',
    },
    body,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Gemini file upload error: ${JSON.stringify(err)}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.file.uri; // e.g. "https://generativelanguage.googleapis.com/v1beta/files/abc123"
}

// ─── File Embedding ────────────────────────────────────────────────────────────

/**
 * Embed a multimodal file that has already been uploaded to Gemini Files API.
 * Supports: images, PDFs, audio, video.
 */
export async function embedGeminiFile(geminiFileUri, mimeType, taskType = 'RETRIEVAL_DOCUMENT') {
  const res = await fetch(
    `${BASE_URL}/models/${embeddingModel}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${embeddingModel}`,
        content: {
          parts: [{ fileData: { mimeType, fileUri: geminiFileUri } }],
        },
        taskType,
        outputDimensionality: embeddingDims,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini embedFile error: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.embedding.values;
}

// ─── Smart Router ──────────────────────────────────────────────────────────────

/**
 * Embed anything — text or file.
 * For files: uploads to Gemini Files API first, then embeds.
 * Returns: { embedding: float[], geminiFileUri?: string }
 */
export async function embedContent({
  text,
  localUri,
  mimeType,
  displayName,
  taskType = 'RETRIEVAL_DOCUMENT',
}) {
  if (text) {
    const embedding = await embedText(text, taskType);
    return { embedding };
  }

  if (localUri && mimeType) {
    const geminiFileUri = await uploadFileToGemini(localUri, mimeType, displayName);
    const embedding = await embedGeminiFile(geminiFileUri, mimeType, taskType);
    return { embedding, geminiFileUri };
  }

  throw new Error('embedContent requires either text or localUri+mimeType');
}

// ─── Vision (describe image content) ──────────────────────────────────────────

/**
 * Use Gemini Vision to describe what's in an image.
 * Returns a plain-text description (used before Nutritionix lookup for meal photos).
 */
export async function describeImage(localUri, prompt = 'Describe the food items in this image in detail.') {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mimeType = localUri.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const res = await fetch(
    `${BASE_URL}/models/${CONFIG.gemini.visionModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ],
        }],
        generationConfig: { maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini vision error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xA;/gi, '\n')
    .replace(/&#xD;/gi, '\n')
    .replace(/&#x9;/gi, '\t');
}

function normalizeDocxXml(xml) {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<w:cr\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<\/w:tr>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  );
}

function isDocxDocument(localUri, mimeType) {
  return mimeType === DOCX_MIME_TYPE || localUri.toLowerCase().endsWith('.docx');
}

async function extractDocxText(localUri) {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64, { base64: true });
  const candidateFiles = [
    'word/document.xml',
    'word/header1.xml',
    'word/header2.xml',
    'word/footer1.xml',
    'word/footer2.xml',
    'word/footnotes.xml',
    'word/endnotes.xml',
  ]
    .map((path) => zip.file(path))
    .filter(Boolean);

  if (!candidateFiles.length) {
    throw new Error('No se encontró contenido legible dentro del archivo Word.');
  }

  const xmlBlocks = await Promise.all(candidateFiles.map((file) => file.async('string')));
  const text = xmlBlocks
    .map(normalizeDocxXml)
    .filter(Boolean)
    .join('\n\n')
    .trim();

  if (!text) {
    throw new Error('No se pudo extraer texto del archivo Word.');
  }

  return text;
}

/**
 * Use Gemini to extract text from a document image or PDF description.
 */
export async function extractDocumentText(localUri, mimeType) {
  if (isDocxDocument(localUri, mimeType)) {
    return extractDocxText(localUri);
  }

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const res = await fetch(
    `${BASE_URL}/models/${CONFIG.gemini.visionModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Extract all text from this medical document. Return the raw extracted text, preserving structure.',
            },
            { inlineData: { mimeType, data: base64 } },
          ],
        }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini OCR error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
