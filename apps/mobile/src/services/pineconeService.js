import { CONFIG } from './config';

const { apiKey, indexHost, topK: defaultTopK } = CONFIG.pinecone;

const headers = {
  'Content-Type': 'application/json',
  'Api-Key': apiKey,
};

// Namespace per patient for data isolation
const ns = (patientId) => `patient-${patientId}`;

// ─── Upsert ────────────────────────────────────────────────────────────────────

/**
 * Store an embedding in Pinecone.
 * @param {string} patientId
 * @param {string} recordId   - matches memory_chunks.pinecone_record_id
 * @param {number[]} embedding - float[] from embeddingService
 * @param {object} metadata   - { source_type, content_kind, content_text, date, ... }
 */
export async function upsertVector(patientId, recordId, embedding, metadata = {}) {
  const res = await fetch(`${indexHost}/vectors/upsert`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vectors: [
        {
          id: recordId,
          values: embedding,
          metadata: {
            patient_id: patientId,
            ...metadata,
            // Truncate content_text for metadata (Pinecone 40KB limit)
            content_text: metadata.content_text
              ? metadata.content_text.slice(0, 1000)
              : undefined,
          },
        },
      ],
      namespace: ns(patientId),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Pinecone upsert error: ${JSON.stringify(err)}`);
  }

  return await res.json();
}

// ─── Query (semantic search) ────────────────────────────────────────────────────

/**
 * Find the most semantically similar chunks for a patient.
 * @param {string} patientId
 * @param {number[]} queryEmbedding
 * @param {number} topK
 * @param {object} filter  - Pinecone metadata filter (optional)
 * Returns array of { id, score, metadata }
 */
export async function queryVectors(patientId, queryEmbedding, topK = defaultTopK, filter = null) {
  const body = {
    vector: queryEmbedding,
    topK,
    namespace: ns(patientId),
    includeMetadata: true,
  };
  if (filter) body.filter = filter;

  const res = await fetch(`${indexHost}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Pinecone query error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.matches ?? [];
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteVector(patientId, recordId) {
  const res = await fetch(`${indexHost}/vectors/delete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ids: [recordId],
      namespace: ns(patientId),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Pinecone delete error: ${JSON.stringify(err)}`);
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getIndexStats() {
  const res = await fetch(`${indexHost}/describe_index_stats`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) return null;
  return await res.json();
}
