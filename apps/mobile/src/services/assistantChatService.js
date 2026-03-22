import { answerQuestion, whatChanged } from './brains/memoryBrain';
import { ensureSupabaseSession } from './patientSessionService';
import { supabase } from './supabaseClient';

const DEFAULT_SESSION_TITLE = 'Asistente';
const CHAT_HISTORY_LIMIT = 40;
const PROMPT_HISTORY_LIMIT = 6;

function isWhatChangedQuestion(text) {
  return /cambió|cambio|última visita|ultima visita/i.test(text);
}

function buildSessionTitle(question) {
  const normalized = question.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 80) : DEFAULT_SESSION_TITLE;
}

function buildWhatChangedText(result) {
  const lines = (result?.changes ?? [])
    .map((change) => `${change.emoji ?? '•'} ${change.description}`)
    .filter(Boolean);

  const parts = [];
  if (result?.headline) {
    parts.push(result.headline);
  }
  if (lines.length > 0) {
    parts.push(lines.join('\n'));
  }
  if (result?.next_action) {
    parts.push(`→ ${result.next_action}`);
  }

  return parts.join('\n\n').trim() || 'Sin cambios registrados aún.';
}

function buildAssistantAnswerText(result) {
  const parts = [];
  if (result?.answer) {
    parts.push(result.answer);
  }
  if (result?.next_action) {
    parts.push(`→ ${result.next_action}`);
  }

  return parts.join('\n\n').trim() || 'No encontré suficiente historial para responder todavía.';
}

async function updateAssistantSession(sessionId, patch = {}) {
  const { error } = await supabase
    .from('assistant_sessions')
    .update({
      last_activity_at: new Date().toISOString(),
      ...patch,
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`No se pudo actualizar la sesión del asistente: ${error.message}`);
  }
}

async function insertAssistantMessage({
  sessionId,
  patientId,
  role,
  contentText,
  inputType = null,
  contentJson = {},
  citationsJson = [],
  followUpsJson = [],
}) {
  const { data, error } = await supabase
    .from('assistant_messages')
    .insert({
      session_id: sessionId,
      patient_id: patientId,
      role,
      input_type: inputType,
      content_text: contentText,
      content_json: contentJson,
      citations_json: citationsJson,
      follow_ups_json: followUpsJson,
    })
    .select('id, role, content_text, content_json, citations_json, follow_ups_json, created_at')
    .single();

  if (error) {
    throw new Error(`No se pudo guardar el mensaje del asistente: ${error.message}`);
  }

  return data;
}

async function listRecentConversation(sessionId, limit = PROMPT_HISTORY_LIMIT) {
  const { data, error } = await supabase
    .from('assistant_messages')
    .select('role, content_text, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`No se pudo cargar el historial reciente del chat: ${error.message}`);
  }

  return (data ?? []).reverse();
}

export async function getOrCreateAssistantSession(patientId) {
  const session = await ensureSupabaseSession();
  const userId = session.user.id;

  const { data, error } = await supabase
    .from('assistant_sessions')
    .select('id, title, last_activity_at')
    .eq('patient_id', patientId)
    .eq('created_by', userId)
    .order('last_activity_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`No se pudo abrir la sesión del asistente: ${error.message}`);
  }

  const existingSession = data?.[0];
  if (existingSession?.id) {
    return existingSession;
  }

  const { data: createdSession, error: insertError } = await supabase
    .from('assistant_sessions')
    .insert({
      patient_id: patientId,
      created_by: userId,
      title: DEFAULT_SESSION_TITLE,
      metadata: {
        surface: 'mobile_asistente',
      },
    })
    .select('id, title, last_activity_at')
    .single();

  if (insertError) {
    throw new Error(`No se pudo crear la sesión del asistente: ${insertError.message}`);
  }

  return createdSession;
}

export async function listAssistantMessages(patientId, limit = CHAT_HISTORY_LIMIT) {
  const session = await getOrCreateAssistantSession(patientId);

  const { data, error } = await supabase
    .from('assistant_messages')
    .select('id, role, content_text, content_json, citations_json, follow_ups_json, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`No se pudo cargar el chat del asistente: ${error.message}`);
  }

  return {
    sessionId: session.id,
    messages: (data ?? []).reverse(),
  };
}

export async function sendAssistantQuestion(question, patientId) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('La pregunta está vacía.');
  }

  const session = await getOrCreateAssistantSession(patientId);
  const recentConversation = await listRecentConversation(session.id, PROMPT_HISTORY_LIMIT);

  const userMessage = await insertAssistantMessage({
    sessionId: session.id,
    patientId,
    role: 'user',
    inputType: 'text',
    contentText: trimmedQuestion,
    contentJson: {
      surface: 'asistente_textbox',
    },
  });

  await updateAssistantSession(session.id, {
    title: session.title === DEFAULT_SESSION_TITLE ? buildSessionTitle(trimmedQuestion) : session.title,
    last_user_message_at: userMessage.created_at,
  });

  const result = isWhatChangedQuestion(trimmedQuestion)
    ? await whatChanged(patientId, 'tu última visita')
    : await answerQuestion(trimmedQuestion, patientId, { recentConversation });

  const assistantText = isWhatChangedQuestion(trimmedQuestion)
    ? buildWhatChangedText(result)
    : buildAssistantAnswerText(result);

  const assistantMessage = await insertAssistantMessage({
    sessionId: session.id,
    patientId,
    role: 'assistant',
    contentText: assistantText,
    contentJson: result ?? {},
    citationsJson: result?.citations ?? [],
    followUpsJson: result?.follow_ups ?? [],
  });

  await updateAssistantSession(session.id, {
    last_assistant_message_at: assistantMessage.created_at,
  });

  return {
    sessionId: session.id,
    userMessage,
    assistantMessage,
    result,
  };
}
