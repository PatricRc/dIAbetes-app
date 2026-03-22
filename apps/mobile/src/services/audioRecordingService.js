import { AudioModule, RecordingPresets } from 'expo-audio';

function createRecorder() {
  const RecorderClass = AudioModule?.AudioRecorder;

  if (!RecorderClass) {
    const error = new Error('Audio recording is not available in this build.');
    error.code = 'MICROPHONE_RECORDING_UNAVAILABLE';
    throw error;
  }

  return new RecorderClass(RecordingPresets.HIGH_QUALITY);
}

export async function ensureMicrophonePermission() {
  const current = await AudioModule.getRecordingPermissionsAsync();
  if (current.granted) return current;
  if (!current.canAskAgain) return current;
  return AudioModule.requestRecordingPermissionsAsync();
}

export async function startMicrophoneRecording() {
  const permission = await ensureMicrophonePermission();

  if (!permission.granted) {
    const error = new Error('Microphone permission was denied.');
    error.code = 'MICROPHONE_PERMISSION_DENIED';
    error.canAskAgain = permission.canAskAgain;
    throw error;
  }

  await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

  try {
    const recorder = createRecorder();
    await recorder.prepareToRecordAsync();
    recorder.record();
    return recorder;
  } catch (error) {
    await resetAudioMode();
    throw error;
  }
}

export async function stopMicrophoneRecording(recorder) {
  if (!recorder) return { uri: null, mimeType: 'audio/m4a' };

  try {
    await recorder.stop();
    const uri = recorder.uri;
    return { uri, mimeType: inferAudioMimeType(uri) };
  } finally {
    await resetAudioMode();
  }
}

export async function cancelMicrophoneRecording(recorder) {
  if (!recorder) { await resetAudioMode(); return; }
  try {
    await recorder.stop();
  } catch {
    // ignore teardown errors
  } finally {
    await resetAudioMode();
  }
}

export async function resetAudioMode() {
  try {
    await AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  } catch {
    // best effort cleanup
  }
}

export function inferAudioMimeType(uri = '') {
  const u = uri.toLowerCase();
  if (u.endsWith('.caf')) return 'audio/x-caf';
  if (u.endsWith('.3gp')) return 'audio/3gpp';
  if (u.endsWith('.aac')) return 'audio/aac';
  if (u.endsWith('.wav')) return 'audio/wav';
  return 'audio/m4a';
}

export function inferAudioFileName(mimeType = 'audio/m4a') {
  switch (mimeType) {
    case 'audio/x-caf': return 'audio_note.caf';
    case 'audio/3gpp':  return 'audio_note.3gp';
    case 'audio/aac':   return 'audio_note.aac';
    case 'audio/wav':   return 'audio_note.wav';
    default:            return 'audio_note.m4a';
  }
}
