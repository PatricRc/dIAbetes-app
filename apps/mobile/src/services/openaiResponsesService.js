import { CONFIG } from './config';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_RESPONSES_MODEL = CONFIG.openai.visionModel || 'gpt-4.1-mini';

function ensureOpenAIApiKey() {
  if (!CONFIG.openai.apiKey) {
    throw new Error('OpenAI API key missing: set EXPO_PUBLIC_OPENAI_API_KEY.');
  }
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch {
    return null;
  }
}

function stringifyErrorPayload(payload) {
  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return 'Unknown error payload';
  }
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = (data?.output ?? [])
    .flatMap((item) => item?.content ?? [])
    .map((content) => content?.text ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();

  return text;
}

function buildInput(prompt, image) {
  if (!image) {
    return prompt;
  }

  return [{
    role: 'user',
    content: [
      { type: 'input_text', text: prompt },
      {
        type: 'input_image',
        image_url: `data:${image.mimeType};base64,${image.base64}`,
      },
    ],
  }];
}

async function createOpenAIResponse({ model = DEFAULT_RESPONSES_MODEL, prompt, instructions, image, maxOutputTokens = 512, format }) {
  ensureOpenAIApiKey();

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.openai.apiKey}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions,
      input: buildInput(prompt, image),
      max_output_tokens: maxOutputTokens,
      ...(format ? { text: { format } } : {}),
    }),
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`OpenAI Responses error: ${stringifyErrorPayload(payload)}`);
  }

  return payload;
}

export function supportsOpenAIVisionMimeType(mimeType) {
  return typeof mimeType === 'string' && mimeType.startsWith('image/');
}

export async function generateVisionTextWithOpenAI({ prompt, base64, mimeType, maxOutputTokens = 512, model = DEFAULT_RESPONSES_MODEL }) {
  const data = await createOpenAIResponse({
    model,
    prompt,
    image: { base64, mimeType },
    maxOutputTokens,
  });

  return extractOutputText(data);
}

export async function generateStructuredJsonWithOpenAI({
  prompt,
  instructions,
  schemaName,
  schema,
  maxOutputTokens = 512,
  model = DEFAULT_RESPONSES_MODEL,
}) {
  const data = await createOpenAIResponse({
    model,
    prompt,
    instructions,
    maxOutputTokens,
    format: {
      type: 'json_schema',
      name: schemaName,
      strict: true,
      schema,
    },
  });

  const outputText = extractOutputText(data);

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error(`OpenAI structured response invalid JSON: ${outputText.slice(0, 200)}`);
  }
}
